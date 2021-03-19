$(".multiple_select").mousedown(function(e) {
  if (e.target.tagName == "OPTION") 
  {
    return; //don't close dropdown if i select option
  }
  $(this).toggleClass('multiple_select_active'); //close dropdown if click inside <select> box
});
$(".multiple_select").on('blur', function(e) {
  $(this).removeClass('multiple_select_active'); //close dropdown if click outside <select>
});

$('.multiple_select option').mousedown(function(e) { //no ctrl to select multiple
  e.preventDefault(); 
  $(this).prop('selected', $(this).prop('selected') ? false : true); //set selected options on click
  $(this).parent().change(); //trigger change event
});


$(".myFilter").on('change', function() {
    var selected = $(".myFilter").val().toString(); //here I get all options and convert to string
    var document_style = document.documentElement.style;
    if(selected !== "")
      document_style.setProperty('--text', "'Selected users: "+selected+"'");
    else
      document_style.setProperty('--text', "'Select user'");
});
