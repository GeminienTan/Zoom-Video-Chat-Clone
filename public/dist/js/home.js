const joinMeeting = (u_id,m_id,m_code) => {

  alert(u_id);
  alert(m_id);
  alert(m_code);
  (async () => {
    const rawResponse = await fetch(`/validateName/${m_code}`);
    const content = await rawResponse.json();

    alert(content);
    if (content.valid) {
      //errorBox.css("visibility", "hidden");
      window.open(
        "/joinMeeting/"+u_id+"&"+m_id+"&"+m_code,
        '_blank' // <- This is what makes it open in a new window.
      );
    } else {
      alert("No Room Found");
      //errorBox.css("visibility", "inherit");
    }
  })();
};
const createMeeting = (u_id,type,c_id,cameraOn) => {

  window.open(
    "/createMeeting/"+u_id+"&"+type+"&"+c_id+"&"+cameraOn,
    '_blank' // <- This is what makes it open in a new window.
  );
};

const addAgenda = (id,addBtn) => { 
  
  var a_topic = $(addBtn).closest('tr').find('.a_topic').val();
  var a_presenter = $(addBtn).closest('tr').find('.a_presenter').val()
  var a_time_allocated = $(addBtn).closest('tr').find('.a_time_allocated').val();
  var rowCount = $(addBtn).closest('table').find('tr').length;

$.ajax({
  url: "addAgenda",
  method: "POST",
  data: {
    s_id: id,
    a_topic:a_topic,
    a_presenter:a_presenter,
    a_time_allocated:a_time_allocated
  },
  success:function(response){  
             if(response.msg=='success'){ 
              var a_id = response.data; 
               var html = '<tr class="update">';
                html += '<td class="pt-3-half">'+(rowCount-1)+'</td>';
                html += '<td class="pt-3-half update" data-id="'+a_id+'" data-column="a_topic" data-type="agenda" contenteditable="true">'+a_topic+'</td>';
                html += '<td class="pt-3-half update" data-id="'+a_id+'" data-column="a_presenter" data-type="agenda" contenteditable="true">'+a_presenter+'</td>';
                html += '<td class="pt-3-half update" data-id="'+a_id+'" data-column="a_time"  data-type="agenda" contenteditable="true">'+a_time_allocated+'</td>';
                html += '<td><span class="table-remove"><button type="submit" onclick="deleteAgenda('+a_id+')" class="btn btn-danger btn-rounded btn-sm my-0 text-danger">Remove</button></span></td></tr>';
                $(addBtn).closest('table').append(html);
                var $tr = $(addBtn).closest('tr');
                $input = $tr.find('input');
                $input.val('');
             }else{  
         JSAlert.alert('Error occurred, please try again.');  
             }  
  },  
  error:function(response){  
    alert('server error occured')  
  }
});

};


const clearHistory = (id) => {

  JSAlert.confirm("Are you sure you want to clear the chat history?").then(function(result) {
    // Check if pressed yes
    if (!result){
    return;
    }
    else{
    window.location.href = "/clearHistory/"+id;
    }
  });
};

const clearChat = (id) => {
  JSAlert.confirm("Are you sure you want to clear the chat history?").then(function(result) {
    // Check if pressed yes
    if (!result){
    return;
    }
    else{
    window.location.href = "/clearChat/"+id;
    }
  });
};

const deleteChannel = (id) => {
  alert("deleteChannel");
  alert(id);
  JSAlert.confirm("Are you sure you want to delete this channel?").then(function(result) {
 
    // Check if pressed yes
    if (!result){
    return;
    }
    else{
    window.location.href = "/deleteChannel/"+id;
    }
  });
};

const deleteRoom = (id) => {
  JSAlert.confirm("Are you sure you want to delete this room?").then(function(result) {
 
    // Check if pressed yes
    if (!result){
    return;
    }
    else{
    window.location.href = "/deleteRoom/"+id;
    }
  });
};

const deleteMember = (id) => {
  JSAlert.confirm("Are you sure you want to remove this member from this room?").then(function(result) {
 
    // Check if pressed yes
    if (!result){
    return;
    }
    else{
    window.location.href = "/deleteMember/"+id;
    }
  });
};

const leaveRoom = (r_id,u_id) => {
  JSAlert.confirm("Are you sure you want to leave this room?").then(function(result) {
 
    // Check if pressed yes
    if (!result){
    return;
    }
    else{
    window.location.href = "/leaveRoom/"+r_id+"&"+u_id;
    }
  });
};

const deleteContact = (id) => {
  JSAlert.confirm("Are you sure you want to remove this person from your contact?").then(function(result) {
 
    // Check if pressed yes
    if (!result){
    return;
    }
    else{
    window.location.href = "/deleteContact/"+id;
    }
  });
};

const deleteAccount = (id) => {
  JSAlert.confirm("Are you sure you want to remove this account? Your friend will miss you.").then(function(result) {
    // Check if pressed yes
    if (!result){
    return;
    }
    else{
    window.location.href = "/deleteAccount/"+id;
    }
  });
};

const deleteSchedule = (id) => {
  JSAlert.confirm("Are you sure you want to remove schedule?").then(function(result) {
 
    // Check if pressed yes
    if (!result){
    return;
    }
    else{
    window.location.href = "/deleteSchedule/"+id;
    }
  });
};

const deleteAgenda = (id) => {
  JSAlert.confirm("Are you sure you want to remove this agenda?").then(function(result) {
 
    // Check if pressed yes
    if (!result){
    return;
    }
    else{
    window.location.href = "/deleteAgenda/"+id;
    }
  });
};

const checkMeetingExist = (id) =>{
  var element = document.getElementById("join-meeting-"+id);
  var buttons = document.getElementById("create-meeting-"+id);
  //If it isn't "undefined" and it isn't "null", then it exists.
  if(typeof(element) != 'undefined' && element != null){
      buttons.style.display ="none";
      

  } else{
      buttons.addClass("d-flex");
      
  }
}

const addMember = (id) =>{
  $("#add-member-room_id").val(id);
  $('#addMember').show();
  return false;
}

const addChannel = (id) =>{
  $("#add-channel-room_id").val(id);
  $('#addChannel').show();
  return false;
}

$('#s_etime').on('blur', function() {
      var startTime = $('#s_stime').val();
      var endTime = $('#s_etime').val();
      var msgText = ("Meeting end time must be after " + startTime + ".  Please update time(s)");
      if (startTime > endTime) {
        $('#addScheduleButton').prop('disabled', true);
        
      JSAlert.alert(msgText);
    }
});
var channelFileInput = document.getElementsByName('channelFile');
var channelListFile = document.getElementsByName('list-file-channel');

for (var i = 0; i < channelFileInput.length; i++) {
  channelFileInput[i].onchange = function () {
    var files = Array.from(this.files);
    files = files.map(file => file.name +'&nbsp' + returnFileSize(file.size));
    for (var k = 0; k < channelListFile.length; k++) {
      channelListFile[k].innerHTML = files.join('<br/>');
    } 
  }   
}
var chatFileInput = document.getElementsByName('chatFile');
var chatListFile = document.getElementsByName('list-file-chat');

for (var j = 0; j < chatFileInput.length; j++) {
  chatFileInput[j].onchange = function () {
    var files = Array.from(this.files);
    files = files.map(file => file.name +'&nbsp' + returnFileSize(file.size) );
    for (var k = 0; k < chatListFile.length; k++) {
      chatListFile[k].innerHTML = files.join('<br/>');
    }
  }   
}

function returnFileSize(number) {
  if(number < 1024) {
    return number + 'bytes';
  } else if(number >= 1024 && number < 1048576) {
    return (number/1024).toFixed(1) + 'KB';
  } else if(number >= 1048576) {
    return (number/1048576).toFixed(1) + 'MB';
  }
}

var imageInput = document.getElementById('u_profilepic');
const preview = document.querySelector('.preview');

imageInput.style.opacity = 0;
imageInput.addEventListener('change', updateImageDisplay);
function updateImageDisplay() {
  while(preview.firstChild) {
    preview.removeChild(preview.firstChild);
  }

  const curFiles = imageInput.files;
  if(curFiles.length === 0) {
    const para = document.createElement('p');
    para.textContent = 'No files currently selected for upload';
    preview.appendChild(para);
  } else {
    const list = document.createElement('ol');
    preview.appendChild(list);

    for(const file of curFiles) {
      const uploadButton = document.getElementById('uploadImgButton');
      

      const listItem = document.createElement('li');
      const para = document.createElement('p');
      if(validFileType(file)) {
        para.textContent = `File name ${file.name}, file size ${returnFileSize(file.size)}.`;
        const image = document.createElement('img');
        image.style.width="250px"
        image.style.height="200px"
        image.style.border="thick solid #8C88FD"
        image.src = URL.createObjectURL(file);

        listItem.appendChild(image);
        listItem.appendChild(para);
        uploadButton.style.backgroundColor = "#2196F3";
      } else {
        para.textContent = `File name ${file.name}: Not a valid file type. Update your selection.`;
        listItem.appendChild(para);
      }

      list.appendChild(listItem);
    }
  }
}

const fileTypes = [
  "image/jpg",
  "image/jpeg",
  "image/pjpeg",
  "image/png",
];

function validFileType(file) {
  return fileTypes.includes(file.type);
}

const checkPoint = (u_name,point) => {
  if(point < 20){
    JSAlert.alert("Sorry " +u_name+", your point is not enough to claim the rewards.");
  }
  else{
    window.location.href = "/claimRewards/"+u_name+"&"+point;
  }
};




