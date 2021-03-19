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
  //var dist = document.getElementById('value').value;
  alert(c_id);
  alert(cameraOn);
  alert(u_id);
  alert(type);
  //window.location.href = "/createMeeting/"+u_id+"&"+type+"&"+c_id+"&"+cameraOn;
  window.open(
    "/createMeeting/"+u_id+"&"+type+"&"+c_id+"&"+cameraOn,
    '_blank' // <- This is what makes it open in a new window.
  );
};

const addAgenda = (id) => {
  //var dist = document.getElementById('value').value;
  alert(id);
};


const clearHistory = (id) => {
  alert("clearHistory");
  alert(id)
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
  alert("deleteRoom");
  alert(id);
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
  alert("deleteMember");
  alert(id);
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

const deleteContact = (id) => {
  alert("deleteContact");
  alert(id);
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
  alert("deleteAccount");
  alert(id);
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
  alert("deleteSchedule");
  alert(id);
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
  alert("deleteAgenda");
  alert(id);
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
      alert('Element exists!');
      buttons.style.display ="none";
      

  } else{
      alert('Element does not exist!');
      buttons.addClass("d-flex");
      
  }
}

const addMember = (id) =>{
  alert(id);
  $("#add-member-room_id").val(id);
  $('#addMember').show();
  return false;
}

const addChannel = (id) =>{

  alert(id);
  $("#add-channel-room_id").val(id);
  $('#addChannel').show();
  return false;
}




