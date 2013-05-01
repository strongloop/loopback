var Todo = require('.');

Todo.beforeRemote('*', function (ctx) {
  // only allow logged in users to access the todo model
  ctx.cancelUnless(ctx.me);
});

Todo.beforeRemote('save', function (todo, ctx) {
  if(!todo.title) {
    // throw an error to cancel an operation
    throw new Error('title is required');
  }

  if(todo.title.length > 144) {
    // or use the ctx api
    ctx.error('title must be shorter than 144 characters');
  }
});

Todo.beforeRemote('save', function (todo, ctx, done) {
  // the ctx api has various validation helpers
  ctx.errorUnless(ctx.isEmail(todos.creator), 'creator must be a valid email');

  if(todo.isNew()) {
    Todo.count({owner: todo.owner}, function (err) {
      if(err) {
        done(err);
      } else {
        ctx.errorIf(count > 100, 'each user can only have 100 todos');
      
        done();
      }
    });
  } else {
    done();
  }
});

Todo.beforeRemote('all', function (query, ctx) {
  // only allow remote queries when filtering by user 
  ctx.cancelUnless(query.creator);
  
  query.limit = query.limit || 16;
  ctx.errorIf(query.limit > 16, 'you may only request 16 todos at a time');
});

Todo.beforeRemote('save', function (todo, ctx) {
  ctx.cancelUnless(ctx.isMe(todo.creator));
});

// define a custom method to be exposed to SDKs
Todo.totalRemaining = function (fn) {
  Todo.count({where: {done: {ne: true}}}, fn);
}
Todo.totalRemaining.remotable = true;
Todo.totalRemaining.returns = [
  {arg: 'total', type: 'Number'}
];
