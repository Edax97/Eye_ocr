const express = require('express');
const https = require('https');

// So we can upload files
const multer = require('multer');
const upload = multer({dest: "uploads/"})

app = express();
app.use(express.urlencoded({extended: true}));
app.use(express.static('public'));

const delay = ms => new Promise(res => setTimeout(res, ms));

app.get('/',(req, res)=>{
  res.sendFile(`${ __dirname }/index.html`);
})

app.post('/', upload.array("img_doc"), (req,res)=>{
  console.log(`\n${req.method} ${req.url}`);
  console.log(req.headers);
  console.log(req.body);
  console.log(req.files);
  const uri = "https://talaveraocr.cognitiveservices.azure.com/vision/v3.2/read/analyze"
  const options = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Ocp-Apim-Subscription-Key': '0290ba551cd140b183ad2751308903f9',
    }
  }

  const body_object = {

    url: 'https://www.scrolldroll.com/wp-content/uploads/2020/04/Karl-Marx-Quotes-2.jpg',
  }

  class getvision {
    constructor(endpoint){
      this.ended = false;
      this.options_get = {
        method: 'GET',
        headers: {
          'Ocp-Apim-Subscription-Key': '0290ba551cd140b183ad2751308903f9',
        }
      }
      this.client_req = https.request(endpoint, this.options_get, (response)=>{
        response.on("data", (d)=>{

          const ocr_res = JSON.parse(d);

          if (ocr_res.status == 'failed' || response.statusCode != 200){
            this.ended = true;
            res.sendFile(`${ __dirname }/failed.html`);
          }

          if (ocr_res.status == 'succeeded'){
            console.log(response.statusCode);
            console.log(ocr_res.status);

            this.ended = true;

            console.log(ocr_res.analyzeResult.readResults[0].lines);
            res.sendFile(`${ __dirname }/results.html`);
          }


        })
      });
    }
    async loopget(){
      while (!this.ended){
        await delay(1000);
        console.log('Trying to get request the results!');
        this.client_req.end();
      }
    }
  }
  const reqvision = https.request(uri, options, (response)=>{
      response.on("data",(data)=>{
        console.log(JSON.parse(data));
      })
      response.on("end", ()=>{
        console.log(response.statusCode);
        if (response.statusCode > 202){
          res.sendFile(`${ __dirname }/failed.html`);
        }
        else{
          console.log(response.headers['operation-location']);

          const get_res_azure = new getvision(response.headers['operation-location']);
          get_res_azure.loopget();
        }



      })

  })

  reqvision.write(JSON.stringify(body_object));
  reqvision.end();
})

app.get('/results', (req,res)=>{
  res.sendFile(`${ __dirname }/results.html`);
})

app.get('/contact', (req,res)=>{
  res.sendFile(`${ __dirname }/contact.html`);
})

app.listen(process.env.PORT || 3000, ()=>{
  console.log("Server starts on port 3000");
})
