
const input_file = $('#img_doc');
const preview = $('.preview');

//
input_file.text("hola");
console.log("input", input_file);
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
  "image/x-icon"
];

    for (const file of fileList){

      if (fileTypes.includes(file.type)){
        const pre_Item = $("<li class='row'></li>").append(`<div class='col'>${ file.name }</div>`).append(`<img class='img_sel col' src='${ URL.createObjectURL(file) }'></img>`);
        preview_list.append(pre_Item);
      }
      else{
        const pre_Item = $("<li class='row'></li>").append(`<div class='col'>${ file.name }</div>`).append(`<div class='col'>File extension not supported</div>`)
        preview_list.append(pre_Item);
      }

    }
  }

})
