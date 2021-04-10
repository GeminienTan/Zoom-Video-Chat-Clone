const socket = io("/");

const cvForm = document.getElementsByClassName('cvForm');

socket.on('message',message =>{
    console.log(message);
});
for (var i = 0 ; i < cvForm.length; i++) {
    cvForm[i].addEventListener('submit',(e)=>{
    alert("ok")
    e.preventDefault();
    //const msg = $(e.target).closest('textarea[name="content"]').val();
    const msg = e.target['content'].value;

    //emit message to server
    socket.emit('conversationMessage',msg);
});
 }

