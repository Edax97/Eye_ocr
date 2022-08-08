const express = require('express');
const https = require('https');

app = express();
app.use(express.urlencoded({extended: true}));
app.use(express.static('public'));

app.get('/',(req, res)=>{
  res.sendFile(`${ __dirname }/index.html`);
})

app.post('/', (req,res)=>{

})

app.listen(process.env.PORT || 3000, ()=>{
  console.log("Server starts on port 3000");
})
