"use strict";
/* jshint asi: true */

const express = require('express')
const redis = require('redis')
const bodyParser = require('body-parser')
const app = express()

const client = redis.createClient(process.env.REDIS_URL || 'redis://localhost')

app.use(bodyParser.json());       // to support JSON-encoded bodies
app.use(bodyParser.urlencoded()); // to support URL-encoded bodies

app.post('/vote', function(req, res) {
  if(!req.body.key) {
    res.send(409, 'Missing key')
    return
  }
  if(!req.body.vote) {
    res.send(409, 'Missing vote')
    return
  }

  const key = req.body.key
  const vote = parseInt(req.body.vote)

  if(vote !== -1 && vote !== 1) {
    res.send(409, 'Missing or invalid vote')
    return
  }

  client.incr((vote === 1 ? 'good-' : 'bad-') + key, function(err) {
    if(err) {
      console.warn(err);
      res.send(500, err.toString())
    }
    res.send('Vote saved')
  })
})

const port = process.env.PORT || 3000
app.listen(port, function() {
  console.log(`App listening on port ${port}!`)
})
