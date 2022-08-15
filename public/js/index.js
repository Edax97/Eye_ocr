
const input_file = $('#im_file');
const preview = $('.preview');
const form = $("#form_up");
const fileTypes = [
  "image/apng",
  "image/bmp",
  "image/gif",
  "image/jpeg",
  "image/pjpeg",
  "image/png",
  "image/svg+xml",
  "image/tiff",
  "image/webp",
  "image/x-icon",
  "application/pdf"
];

//
input_file.text("hola");

input_file.css('opacity','0');

//
input_file.on('change',()=>{
  //Empty preview area
  preview.empty();

  //Check FileName
  const fileList = input_file.prop('files');

  //If there is no file selected
  if (fileList.length == 0){
    preview.append('<p>No file selected</p>');
  }

  //If there are files selected
  else{
    preview_list = $("<ol class='container'></ol>");
    preview.append(preview_list);



    for (const file of fileList){

      if (fileTypes.includes(file.type)){
        const pre_Item = $("<li class='row'></li>").append(`<div class='col-sm-4 col-12 mb-3 text-break'>${ file.name }</div>`).append(`<div class='col-sm-8 col-12'><img class='img_sel' src='${ URL.createObjectURL(file) }'></img></div>`);
        preview_list.append(pre_Item);
      }
      else{
        const pre_Item = $("<li class='row'></li>").append(`<div class='col-sm-4 col-12 mb-3 text-break'>${ file.name }</div>`).append(`<div class='col-sm-8 col-12'>File extension not supported</div>`)
        preview_list.append(pre_Item);
      }

    }
  }

})


form.on("submitt", (e)=>{
    e.preventDefault();
    const files = document.getElementById("files");
    const formData = new FormData();
    console.log( files.files );
    if (files.files.length == 0){
      alert("None selected file!")
    }

    else if (fileTypes.includes(files.files[0].type)){
      formData.append("files", files.files[0]);

      fetch("/", {
            method: 'POST',
            body: formData,
            headers: {

              },
          })
              .then((res) => console.log(res))
              .catch((err) => ("Error occured", err));
    }

    else{
      alert("Not a compatible image file!")
    }
})
