const express = require('express');
require('./db/mongoose');
const userRouter = require('./routers/user');
const taskRouter = require('./routers/task');

const app = express(); // using mongoose express function as a variable

app.use(express.json());
app.use(userRouter);
app.use(taskRouter);

//
// Without middleware: new request -> run route handler (basic)
//
// With middleware: new request -> do something -> run route handler (fit my needs)
//

module.exports = app;
