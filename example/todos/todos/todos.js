var todos = require('.');

todos.app.get('/completed', function (req, res) {
  todos.model.all({where: {creator: req.me, done: true}}, todos.done);
});

todos.on('validate', function (todo, ctx) {
  if(!todo.title) {
    throw new Error('title is required');
  }

  if(todo.title.length > 144) {
    ctx.error('title must be shorter than 144 characters');
  }
});

todos.on('create', function (todo, ctx, done) {
  ctx.errorUnless(ctx.isEmail(todos.creator));

  todos.model.count({owner: todo.owner}, function (err) {
    if(err) {
      done(err);
    } else {
      ctx.errorIf(count > 100, 'each user can only have 100 todos');
      
      done();
    }
  });
});

todos.on('query', function (query, ctx) {
  ctx.cancelUnless(query.creator);
  query.$limit = query.$limit || 16;
  ctx.errorIf(query.$limit > 16, 'todos can only include a maximum of 16 results');
});

todos.on('modify', function (todo, ctx) {
  ctx.cancelUnless(ctx.isMe(todo.creator));
});

todos.on('request', function (ctx) {
  ctx.cancelUnless(ctx.me);
});