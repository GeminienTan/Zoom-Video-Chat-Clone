const deleteUser = (id) => {
    JSAlert.confirm("Are you sure you want to remove this user?").then(function(result) {
   
      // Check if pressed yes
      if (!result){
      return;
      }
      else{
      window.location.href = "/deleteUser/"+id;
      }
    });
};

const deleteAdmin = (id) => {
    JSAlert.confirm("Are you sure you want to remove this admin?").then(function(result) {
   
      // Check if pressed yes
      if (!result){
      return;
      }
      else{
      window.location.href = "/deleteAdmin/"+id;
      }
    });
};
const logout = () => {
  JSAlert.confirm("Are you sure you want logout?").then(function(result) {
 
    // Check if pressed yes
    if (!result){
    return;
    }
    else{
    window.location.href = "/admin/logout";
    }
  });
};

