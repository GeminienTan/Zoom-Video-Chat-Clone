function validateForm() {
    var topic = $('#a_topic').val();
    var presenter = $('#a_presenter').val();
    var time = $('#a_time_allocated').val();
    
    if(topic ==''){
        alert("Topic is required.")
        return false;
    }
    if(presenter ==''){
        alert("Presenter is required.")
        return false;
    }
    if(time ==''){
        alert("Time Allocated is required.")
        return false;
    }
    if(topic !='' && presenter!='' && time!=''){
        alert(topic);
        alert(presenter+time)
        return false;
    }

}