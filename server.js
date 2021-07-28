const express = require('express');
// const bodyParser = require('body-parser')
const bcrypt = require('bcrypt-nodejs');
const cors= require('cors')
const knex = require('knex');
const { response } = require('express');
const clarifai= require('clarifai')

const db= knex({
    client: 'pg',
    connection: {
      host : '127.0.0.1',
      user : 'prachijain',
      password : '',
      database : 'face-recognition'
    }
  });

db.select('*').from('users').then(data=>{
    // console.log(data)
});


const app = express();

app.use(cors());
app.use(express.json());


// const database={
//     users: [
//         {
//             id:'123',
//             name: 'John',
//             email: 'john@example.com',
//             password: 'cookies',
//             entries: 0,
//             joined: new Date()

//         },
//         {
//             id:'1234',
//             name: 'Sally',
//             email: 'sally@example.com',
//             password: 'bananas',
//             entries: 0,
//             joined: new Date()

//         }
//     ]
// };

// app.get('/', (req, res) =>{
//     res.send(database.users);
// })


app.post('/signin', (req, res) => {
   const {email, password} = req.body;
   if(!email || !password){
     return res.status(400).json("Inavlid Credentials")
   }
    db.select('email', 'hash').from('login')
      .where('email', '=', req.body.email)
      .then(data => {
        const isValid = bcrypt.compareSync(req.body.password, data[0].hash);
        if (isValid) {
          return db.select('*').from('users')
            .where('email', '=', req.body.email)
            .then(user => {
              res.json(user[0])
            })
            .catch(err => res.status(400).json('unable to get user'))
        } else {
          res.status(400).json('wrong credentials')
        }
      })
      .catch(err => res.status(400).json('wrong credentials'))
  })


app.post('/register', (req, res) => {
    const { email, name, password } = req.body;
    if(!email || !name || !password){
      return res.status(400).json('incorret form submission')
    }
    const hash = bcrypt.hashSync(password);
      db.transaction(trx => {
        trx.insert({
          hash: hash,
          email: email
        })
        .into('login')
        .returning('email')
        .then(loginEmail => {
          return trx('users')
            .returning('*')
            .insert({
              email: loginEmail[0],
              name: name,
              joined: new Date()
            })
            .then(user => {
              res.json(user[0]);
            })
        })
        .then(trx.commit)
        .catch(trx.rollback)
      })
      .catch(err => res.status(400).json('unable to register'))
  })

app.get('/profile/:id', (req, res) =>{
    const {id} = req.params;
    
    db.select('*').from('users').where({
        id: id
    }).then(user=>{
        // console.log(user)
        res.json(user[0])
    }).catch(err=> res.status(400))
    
})

app.put('/image',(req,res)=>{
    const {id} = req.body;
    db('users').where('id','=',id)
    .increment('entries',1)
    .returning('entries')
    .then(entries=>{
        res.json(entries[0]);
    })
    .catch(err=> res.status(400).json("unable to get rank!"))
    
})

app.listen(3001,()=>{
    console.log("App is running on port 3001")
})




