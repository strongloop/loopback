#!/usr/bin/env ruby

require 'active_support'
require 'active_support/core_ext'
require 'octokit'
require 'faraday-http-cache'
require 'typhoeus/adapters/faraday'
require 'base64'
require 'yaml'

repo_types = (ARGV[0] || 'public').split(',')
span = ARGV[1] || 'week'

today = Date.current
last_week = today.last_week

sprints = [
  [Date.parse('May 5, 2015'), Date.parse('May 18, 2015'), 70]
]
while sprints.last[1] < today do
  prev = sprints.last
  sprints << [prev[0] + 14.days, prev[1] + 14.days, prev[2] + 1]
end
weeks = sprints.last(4).reverse

token = ENV['GITHUB_TOKEN']
if token.nil? or token.empty?
  token = `git config github.token`.strip
end

if token.empty?
  STDERR.puts 'Please visit https://github.com/settings/tokens/new to generate a token'
  STDERR.puts "Once you have your token, run 'git config github.token <token>'"
  exit 1
end

# Response middleware that overrides the max-age.
# This allows the caching middleware to store things for up to a week
class MoarCacheable < Faraday::Middleware
  def call(request_env)
    @app.call(request_env).on_complete do |response_env|
      if response_env[:response_headers]["cache-control"] == "private, max-age=60, s-maxage=60"
        response_env[:response_headers]["cache-control"] = "private, max-age=604800, s-maxage=604800"
      end
    end
  end
end

class SimpleLogger
  def initialize(stream)
    @stream = stream
  end
  def debug(*a)
  #  @stream.puts *a
  end
end

store = ActiveSupport::Cache.lookup_store(:file_store, "/tmp/gh_cache")

stack = Faraday::RackBuilder.new do |builder|
  builder.use Faraday::HttpCache, shared_cache: false, store: store, serializer: Marshal, logger: SimpleLogger.new(STDERR)
  builder.use Octokit::Response::RaiseError
  builder.adapter Faraday.default_adapter
end
#npm = Faraday.new(url: 'https://registry.npmjs.org', builder: stack)

gh = Octokit::Client.new(access_token: token, auto_paginate: true, middleware: stack)
if not gh.user_authenticated?
  STDERR.puts "Unauthenticated connection to GitHub, private repos will be invisible"
end

starting = gh.rate_limit!.remaining
STDERR.puts "GitHub API: #{gh.rate_limit}"

$commitsToSkip = Hash.new {|h,k| h[k] = []}

def maybe_pr(gh, path, number)
  gh.pull_request(path, number) rescue false
end

def pp_commit(gh, r, commit)
  msg = commit.commit.message.lines.first.strip
  if $commitsToSkip[r.full_name].include? commit.sha
    nil
  elsif msg =~ /\AMerge pull request #(\d+) from/ and pr = maybe_pr(gh, r.full_name, $~[1])
    gh.pull_request_commits(r.full_name, pr.number).each do |c|
      $commitsToSkip[r.full_name] << c.sha
    end
    "[PR##{pr.number}](#{pr.html_url}) #{pr.title} ([#{pr.user.login}](#{pr.user.html_url}))"
  elsif msg =~ /\Av?\d+\.\d+\.\d+\Z/
    c = commit
    gc = commit.commit # lower level git info
    author = gc.author.name
    if c.author
      author = "[#{author}](#{c.author.html_url})"
    end
    "**Released #{msg}** (#{author})"
  else
    c = commit
    gc = commit.commit # lower level git info
    author = gc.author.name
    if c.author
      author = "[#{author}](#{c.author.html_url})"
    end
    "[@#{c.sha[0..6]}](#{c.html_url}) #{msg} (#{author})"
  end
end

def badge(alt, img, url)
  "[![#{alt}](#{img})](#{url})"
end

def issues_badge(repo)
  badge('GitHub Issues',
        "https://img.shields.io/github/issues/#{repo.full_name}.svg",
        "#{repo.html_url}/issues")
end

def downloads_badge(repo)
  badge('Downloads',
        "https://img.shields.io/npm/dm/#{repo.npm_name}.svg",
        "https://npmjs.com/package/#{repo.npm_name}")
end

def pp_week(gh, week, repos)
  repos.group_by { |r|
    if r.name =~ /connector/
      'Connectors'
    elsif r.name =~ /component/
      'Components'
    elsif r.name =~ /-sdk-/
      'SDKs'
    else
      'Core'
    end
  }.each do |group, repos|
    puts "\n### #{group}\n"
    repos.each do |repo|
      commits = repo.commits.reject { |c|
                  c.commit.message =~ /\AMerge (branch|tag)/
                }.reject { |c|
                  c.commit.committer.date <= week[0] or
                  c.commit.committer.date >= week[1]
                }.map {|c|
                  pp_commit(gh, repo, c)
                }.compact
      next if commits.empty?
      heading = repo.npm_name || repo.name
      #heading << " #{issues_badge(repo)}"
      #if repo.npm_json.nil?
      #  heading << ' *package not available on npm*'
      #else
      #  heading << " #{downloads_badge(repo)}"
      #end
      puts " * #{heading}"
      # puts "#### v.Next"
      commits.each do |c|
        if c =~ /\A#+/
          puts
          puts c
        else
          puts "   * #{c}"
        end
      end
    end
    puts
  end
end

REPOS = [
  'loopback',
  'loopback-boot',
  'loopback-datasource-juggler',
  'loopback-sdk-angular',
  'loopback-sdk-ios',
  'loopback-sdk-angular',
  'loopback-sdk-xamarin',
  'generator-loopback',
  'loopback-connector-*',
  'loopback-swagger',
  'loopback-component-*',
  'loopback-phase',
  'loopback-filters',
]

repos = repo_types
  .flat_map {|t| gh.org_repos('strongloop', type: t) }
  .select { |r| REPOS.any? {|pat| File.fnmatch?(pat, r.name) } }
  .map { |r|
    r.tap { |r|
      r.pkg_json_c = gh.contents(r.full_name, path: 'package.json') rescue nil
      if r.pkg_json_c and r.pkg_json_c.type == 'file' and r.pkg_json_c.encoding == 'base64'
        r.pkg_json = Base64.decode64(r.pkg_json_c.content)
        r.pkg = YAML.load(r.pkg_json)
        r.npm_name = r.pkg['name']
        r.npm_json = npm.get("/#{r.npm_name}") rescue false
        r.npm_info = YAML.load(r.npm_json.body) rescue {}
        r.npm_releases = {}
        (r.npm_info['time'] || []).each do |ev, at|
          at = Time.parse(at)
          if ev != 'modified' and ev != 'created' and at >= weeks.last[0] and at <= weeks.first[1]
            r.npm_releases[ev] = at
          end
        end
      else
        r.pkg_json = nil
        r.npm_releases = {}
        r.npm_info = {}
      end
      r.commits = gh.commits_between(r.full_name, weeks.last[0], weeks.first[1]) rescue []
      r.shas = r.commits.map(&:sha)
    }
  }
STDERR.puts "gathering repos used: #{starting - gh.rate_limit!.remaining} requests (#{gh.rate_limit})"

# Frontmatter for Jekyll
puts '---'
puts 'layout: page'
puts '---'


weeks.each do |week|
  heading = "Sprint #{week[2]} (#{week[0]} to #{week[1]})"
  if week[1].future?
    heading << ' so far'
  end
  puts "## #{heading}"
  pp_week(gh, week, repos)
  STDERR.puts "post pp_week(#{week[0]}) used: #{starting - gh.rate_limit!.remaining} requests (#{gh.rate_limit})"
  puts '----'
  puts
end

STDERR.puts "Used #{starting - gh.rate_limit!.remaining} requests (#{gh.rate_limit})"
