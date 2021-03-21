const express = require('express');
const mysql = require('mysql');
const app = express();
const session = require('express-session');
const server = require('http').Server(app);
const io = require('socket.io')(server);
const bodyParser = require('body-parser');
const CryptoJS = require('crypto-js');
const { ExpressPeerServer } = require('peer');
const fileUpload = require('express-fileupload');
const flash = require('req-flash');

// File System for loading the list of words
var fs = require('fs');

//A simple JavaScript alert manager
const JSAlert = require("js-alert");
//A JavaScript date library for parsing, validating, manipulating, and formatting dates
const moment = require('moment');

//A node.js middleware for handling multipart/form-data, which is primarily used for uploading files. 
const multer = require('multer');

const path = require('path');

const peerServer = ExpressPeerServer(server, {
  debug: true,
});
const { v4: uuidV4, validate: uuidV4Validate } = require("uuid");
//mysql

var mysqlConnection  = require('./public/lib/db');

const { holdReady } = require('jquery');

app.set("view engine", "ejs");

app.use(express.static("public"));

app.use("/peerjs", peerServer);

app.use(bodyParser.json());

app.use(bodyParser.urlencoded({ extended: false }));

app.use(fileUpload());

app.set('trust proxy', 1) // trust first proxy

var sess = {
  secret: 'secret',
  resave: true,
  saveUninitialized: true,
  rolling: true,
  cookie: {
    httpOnly: false,
    maxAge: 6600000,
  }
}

if (app.get('env') === 'production') {
  app.set('trust proxy', 1) // trust first proxy
  sess.cookie.secure = false // serve secure cookies
}

app.use(session(sess));


var notifications;

var exists = fs.existsSync('notifications.json');
if (exists) {
  // Read the file
  console.log('loading notifications');
  var txt = fs.readFileSync('notifications.json', 'utf8');
  // Parse it  back to object
  notifications = JSON.parse(txt);
} else {
  // Otherwise start with blank list
  console.log('No notifications');
  notifications = [];
}


app.get("/", (req, res) => {
  res.render("index");
});

app.get("/Call", (req, res) => {
  res.render("call");
});

app.get("/dish", (req, res) => {
  res.render("dish");
});


//when user click sign-up button
app.get("/sign-up", (req, res) => {
  res.render("sign-up");
});

app.get("/admin", (req, res) => {
  res.render(__dirname + '/views/admin/sign-in');
});

app.post("/admin/sign-in", (req, res) => {
  const key = req.body.adminKey;
  const password = CryptoJS.MD5(req.body.password);
  console.log(key);
  console.log(password.toString());
  let sql = "SELECT * from admin WHERE ad_key= ? AND ad_password=? ";
  
  let query = mysqlConnection.query(sql,[key,password.toString()],(err, rows) => {
    if(err) throw err;
    if(rows==0){
      res.render('index', { message:"error" });
    }
    rows.forEach((row) => {
      const ad_id = row.ad_id;
      req.session.ad_id = ad_id;
      req.session.save();
      res.redirect('/admin/dashboard');
      
    });
  });
});

app.get("/admin/dashboard", (req, res) => {
  if(!req.session.ad_id) {
    res.redirect('/admin');
  }
  else{
  const ad_id = req.session.ad_id;
  var queries = [
        "SELECT u_name,u_gender,u_email,u_phone,u_dob,u_profilepic FROM user WHERE u_status = 'A'",
      ];
    
      mysqlConnection.query(queries.join(';'),(err, results, fields) => {
    
        if (err) throw err;
        res.render((__dirname + '/views/admin/dashboard'),{
          ad_id:ad_id,
          moment: moment,
          user:results[0]
        });
      });
    }
  
});

//when user submit form to sign up 
app.post('/sign-up',(req, res) => {
  const u_fname = req.body.fname;
  const u_lname = req.body.lname;
  const u_name = u_fname +" "+ u_lname;
  const u_password = CryptoJS.MD5(req.body.password);
  let data = {u_name: u_name,u_gender: req.body.gender,u_dob: req.body.birthday,u_phone: req.body.phone,u_email: req.body.email,u_password: u_password.toString(),u_profilepic: "dist/img/avatars/avatar-default.jpg",u_point:0,u_status:'A'};
  //console.log(data);
   let sql = "INSERT INTO user SET ?";
    let query = mysqlConnection.query(sql, data,(err, results) => {
    if(err) throw err;
    res.render('index', { message:"success" });
    });
});

//when user submit form to sign in 
app.post('/home',(req, res) => {
  const u_email = req.body.email;
  const u_password = CryptoJS.MD5(req.body.password);
  let sql1 = "SELECT * from user WHERE u_email= ? AND u_password=? ";
  
  let query1 = mysqlConnection.query(sql1,[u_email,u_password.toString()],(err, rows) => {
    if(err) throw err;
    if(rows==0){
      res.render('index', { message:"error" });
    }
    rows.forEach((row) => {
      const u_id = row.u_id;
      const u_name = row.u_name;
      req.session.u_id = u_id;
      req.session.u_name = u_name;
      req.session.save();
      res.redirect('/home');
      
    });
  });
});

app.get("/home",(req,res) =>{
  if(!req.session.u_id) {
    res.redirect('/');
  }
  else{
  const u_id = req.session.u_id;
  const u_name = req.session.u_name;
  var queries = [
        "SELECT ct_id,user.u_id,u_name,u_profilepic,u_status,u_email FROM user INNER JOIN contact ON (contact.ct_email = user.u_email) WHERE contact.u_id =? AND contact.ct_status = 'A'",
        "SELECT DISTINCT room.r_id as r_id,c_title,c_desc,c_id FROM room LEFT JOIN room_record ON (room.r_id = room_record.r_id) INNER JOIN channel ON (channel.r_id = room.r_id) WHERE room_record.u_id=? OR room.r_owner_id =? AND room.r_status = 'A' AND channel.c_status ='A'",
        "SELECT DISTINCT room.r_id as r_id,r_title,r_desc,r_status,u_name as owner_name ,u_profilepic as owner_profilepic,user.u_id as owner_id FROM room LEFT JOIN room_record ON (room.r_id = room_record.r_id) INNER JOIN user ON (room.r_owner_id = user.u_id) WHERE room_record.u_id= ? OR room.r_owner_id =? AND room.r_status = 'A'",
        "SELECT rr_id,room_record.r_id as r_id,user.u_name as u_name,user.u_profilepic as u_profilepic FROM room_record INNER JOIN user ON (user.u_id = room_record.u_id) WHERE rr_status='A'",
        "SELECT * FROM schedule WHERE s_status = 'A' AND u_id=?",
        "SELECT s_id,user.u_name as u_name FROM attendees INNER JOIN user ON (user.u_id = attendees.u_id)",
        "SELECT schedule.s_id as s_id, user.u_name as presenter,a_id,a_topic,a_time_allocated FROM agenda INNER JOIN schedule ON (schedule.s_id = agenda.s_id) INNER JOIN user ON (agenda.a_presenter = user.u_id) WHERE a_status = 'A'",
        "SELECT * FROM user WHERE u_id=?",
        "SELECT u1.u_name as sender_name, u2.u_name as receiver_name, u1.u_id as sender_id, u2.u_id as receiver_id,  u1.u_profilepic as sender_profilepic, u2.u_profilepic as receiver_profilepic, u1.u_status as sender_status, u2.u_status as receiver_status, cv_id FROM conversation INNER JOIN user u1 ON(u1.u_id = conversation.cv_sender) INNER JOIN user u2 ON(u2.u_id = conversation.cv_receiver) WHERE cv_sender = ? or cv_receiver = ?",
        "SELECT u1.u_name as sender_name, u2.u_name as receiver_name, u1.u_id as sender_id, u2.u_id as receiver_id, u1.u_profilepic as sender_profilepic, u2.u_profilepic as receiver_profilepic,cm_content,cm_datetime,cm_file,chat_message.cv_id as cv_id FROM chat_message INNER JOIN user u1 ON(u1.u_id = chat_message.cm_sender) INNER JOIN user u2 ON(u2.u_id = chat_message.cm_receiver) WHERE cm_sender=? OR cm_receiver=? ORDER BY cm_datetime ASC",
        "SELECT user.u_id as sender_id, user.u_name as sender_name, user.u_profilepic as sender_profilepic, ch_id, ch_content, ch_file, c_id from channel_message INNER JOIN user ON (user.u_id = channel_message.ch_sender_id) WHERE ch_status='A' ORDER BY ch_datetime ASC",
        "SELECT * from meeting WHERE m_etime IS NULL AND m_owner_id !=?",
      ];
    
      mysqlConnection.query(queries.join(';'),[u_id,u_id,u_id,u_id,u_id,u_id,u_id,u_id,u_id,u_id,u_id,u_id],(err, results, fields) => {
    
        if (err) throw err;

        /*console.log(results[0]);
        console.log(results[1]);
        console.log(results[2]);
        console.log(results[3]);
        console.log(results[4]);
        console.log(results[5]);
        console.log(results[6]);
        console.log(results[7]);*/
        //console.log(results[11]);
        //console.log(req.session.alertMessage)
        /*for (i in notifications) {
          console.log(Array.isArray(notifications[i].u_id));
        }*/
        
        req.session.contact = results[0];
        req.session.channel = results[1];
        req.session.room = results[2];
        req.session.member = results[3];
        req.session.schedule = results[4];
        req.session.attendees = results[5];
        req.session.agenda = results[6];
        req.session.account =results[7];
        req.session.conversation = results[8];
        req.session.message = results[9];
        req.session.channel_message = results[10];
        req.session.meeting = results[11];
        req.session.save();

        res.render('home', {
          u_id:u_id,
          u_name:u_name,
          moment: moment,
          notifications:notifications,
          contact: req.session.contact,
          channel: req.session.channel, 
          room: req.session.room,
          member:req.session.member,
          schedule: req.session.schedule,
          attendees: req.session.attendees,
          agenda: req.session.agenda,
          account:req.session.account,
          conversation:req.session.conversation,
          message:req.session.message,
          channel_message:req.session.channel_message,
          meeting:req.session.meeting,
          alertMessage:req.session.alertMessage
        });
      });
    }
    
});


//when user submit form to addRoom 
app.post('/addRoom',(req, res) => {
  let roomData = {r_title: req.body.r_title, r_desc: req.body.r_desc,r_status:'A',r_owner_id: req.body.owner_id};
  let channelData = {c_title: req.body.c_title, c_desc: req.body.c_desc,c_status:'A'};
  let attendees = req.body.c_attendees;
  let sql1 = "INSERT INTO room SET ? OUTPUT INSERTED.r_id INTO #RowsInserted";
  let query1 = mysqlConnection.query(sql1, roomData,(err, results) => {
    if(err) throw err;

    let sql2 = "INSERT INTO channel SET ?,r_id=(SELECT * FROM #RowsInserted;) ";
    let query2 = mysqlConnection.query(sql2, channelData,(err2, results2) => {
      if(err2) throw err2;
    });

    const attendeesIsArray = Array.isArray(attendees);
    if (attendeesIsArray == true){
      for($i=0;$i<attendees.length;$i++) {
        
        if(attendees[$i] != '')
        {
          let sql3 = "INSERT INTO room_record SET r_id=(SELECT max(r_id) FROM room), u_id= (SELECT u_id FROM user WHERE u_name = ? ), rr_status='A'";
          let query3 = mysqlConnection.query(sql3,attendees[$i] ,(err3, results3) => {
            if(err3) throw err3;
            generateNotification(r_id,attendees);
          });
        }
      }  
    }
    else{
      let sql4 = "INSERT INTO room_record SET r_id=(SELECT max(r_id) FROM room), u_id= (SELECT u_id FROM user WHERE u_name = ? ), rr_status='A'";
      let query4 = mysqlConnection.query(sql4,attendees ,(err4, results4) => {
        if(err4) throw err4;
        generateNotification(r_id,attendees);
      });
    }
    
    

  });
  req.session.alertMessage = 'Room created successfully!';
  req.session.save();
  res.redirect("home");

});

//when user submit form to addRoom 
app.post('/addChannel',(req, res) => {
  let r_id= req.body.room_id;
  let channelData = {c_title: req.body.c_title, c_desc: req.body.c_desc,c_status:'A'};
  
    let sql1 = "INSERT INTO channel SET ?,r_id=?";
    let query1 = mysqlConnection.query(sql1, [channelData,r_id],(err1, results1) => {
      if(err1) throw err1;
      console.log("Insert Channel Successfully!");
    });
    res.redirect("home");
});

app.post('/addMember',(req, res) => {
  let r_id = req.body.room_id;
  let attendees = req.body.c_attendees;
  const attendeesIsArray = Array.isArray(attendees);
    if (attendeesIsArray == true){
      for($i=0;$i<attendees.length;$i++) {
        
        if(attendees[$i] != '')
        {
          let sql1 = "INSERT INTO room_record SET r_id=?, u_id= (SELECT u_id FROM user WHERE u_name = ? ), rr_status='A'";
          let query1 = mysqlConnection.query(sql1,[r_id,attendees[$i]],(err1, results1) => {
            if(err1) throw err1;
            
          });
        }
      }  
    }
    else{
      let sql2 = "INSERT INTO room_record SET r_id=?, u_id= (SELECT u_id FROM user WHERE u_name = ?), rr_status='A'";
      let query2 = mysqlConnection.query(sql2,[r_id,attendees],(err2, results2) => {
        if(err2) throw err2;
      });
    }
    generateNotification(r_id,attendees);
    res.redirect("/home");

});

app.post('/addContact',(req, res) => {
  
  let data = {ct_email: req.body.ct_email, u_id:req.body.u_id ,ct_status:'A'};
    let sql = "INSERT INTO contact SET ?";
    let query = mysqlConnection.query(sql, data,(err, results) => {
      if(err) throw err;
      console.log("Insert Contact Successfully!");

    });
});

app.post('/addChat',(req, res) => {
  let filePath;
  
  if (!req.files || Object.keys(req.files).length === 0) {
    filePath = null;
  }
  else{
    let sampleFile = req.files.chatFile;
    filePath= 'dist/file/' + sampleFile.name;
  }

  let current_time = moment().format("YYYY-MM-DD HH:mm:ss");
  var cv_sender = req.body.sender;
  var sender_name = req.body.u_name;
  var cv_id = parseInt(req.body.cv_id);

  if (isNaN(cv_id) == true){
      let sql1 = "SELECT u_id FROM user WHERE u_name =?";
      let query1 = mysqlConnection.query(sql1,req.body.receiver ,(err, rows) => {
        if(err) throw err;
        rows.forEach((row) => {
          var cv_receiver = row.u_id;
          let chatData = {cm_content: req.body.content,cm_file:null,cm_datetime:current_time,cm_receiver: cv_receiver,cm_sender: cv_sender,cm_status: 'A'};
          
          var notificationContent = {
            "notification":"send you a new message.",
            "from":sender_name,
            "u_id":[cv_receiver],
            "date":current_time,
            "status":"unread",
            "type":"chat"
          };

          //create conversation
          let sql2 = "SELECT cv_id FROM conversation WHERE (cv_receiver=? AND cv_sender=?) OR (cv_sender=? AND cv_receiver=?)";
          let query2 = mysqlConnection.query(sql2,[cv_receiver,cv_sender,cv_receiver,cv_sender] ,(err2, rows) => {
            if(err2) throw err2;
            if(rows==0){
              console.log("New conversation");
              let sql3 = "INSERT into conversation SET cv_receiver=?,cv_sender=?";
              let query3 = mysqlConnection.query(sql3,[cv_receiver,cv_sender] ,(err3, results) => {
                if(err3) throw err3;
                console.log("Insert conversation successfully");
                
                let sql4 = "INSERT into chat_message SET ? , cv_id= (SELECT MAX(cv_id) as cv_id from conversation)";
                let query4 = mysqlConnection.query(sql4,chatData,(err4, results) => {
                  if(err4) throw err4;
                  console.log("Insert message successfully with new conver");
                  addNotification(notificationContent);
                });
              });
            }
            rows.forEach((row) => {
              cv_id = row.cv_id;
              let sql5 = "INSERT into chat_message SET ? , cv_id= ?";
                let query5 = mysqlConnection.query(sql5,[chatData,cv_id],(err5, results4) => {
                  if(err5) throw err5;
                  console.log("Insert message successfully with old conver");
                  addNotification(notificationContent);
                  res.redirect('/home');
            });

            });
          });
        });
      });
  }
  else{
    var cv_receiver = parseInt(req.body.receiver);
    var cv_sender = parseInt(req.body.sender);
    var notificationContent = {
      "notification":"send you a new message",
      "from":sender_name,
      "u_id":[cv_receiver],
      "date":current_time,
      "status":"unread",
      "type":"chat"
    };

    let chatData = {cm_content: req.body.content,cm_file:filePath,cm_datetime:current_time,cm_receiver: cv_receiver,cm_sender: cv_sender,cv_id:cv_id,cm_status: 'A'};
    let sql6 = "INSERT into chat_message SET ?";
            let query6 = mysqlConnection.query(sql6,[chatData,cv_id],(err6, results) => {
              if(err6) throw err6;
              console.log("Insert message successfully with old conver");
              addNotification(notificationContent);
              res.redirect('/home');

            });
    console.log(chatData);
  }
});


//when user submit form to add Schedule 
app.post('/addSchedule',(req, res) => {
  let scheduleData = {s_title: req.body.s_title, s_objective: req.body.s_objective,s_status:'A',s_date: req.body.s_date,s_stime: req.body.s_stime,s_etime: req.body.s_etime,u_id:req.body.owner_id};
  let attendees = req.body.s_attendees;

  let sql1 = "INSERT INTO schedule SET ?";
  let query1 = mysqlConnection.query(sql1, scheduleData,(err, results) => {
    if(err) throw err;
    console.log("Insert Successfully");

    for($i=0;$i<attendees.length;$i++) {

      if(attendees[$i] != '')
      {
        let sql2 = "INSERT INTO attendees SET u_id=(SELECT u_id FROM user WHERE u_name = ? ),s_id=(SELECT max(s_id) FROM schedule)";
        let query2 = mysqlConnection.query(sql2,attendees[$i] ,(err2, results2) => {
          if(err2) throw err2;
          res.redirect('/home');
        });
      }
    }
  });

});

app.post('/editAgenda',(req, res) => {
  var a_id =  parseInt(req.body.id);
  var column_name = req.body.column_name;
  var value = req.body.value;
  var sql;

  if(column_name == "a_topic"){
    sql = "UPDATE agenda SET a_topic = ? where a_id = ?";
  }else if(column_name == "a_presenter"){
    sql = "UPDATE agenda SET a_presenter = (SELECT u_id FROM user WHERE u_name = ?)  where a_id = ?";
  }else if(column_name == "a_time"){
    value = parseInt(value);
    sql = "UPDATE agenda SET a_time_allocated = ? where a_id = ?";
  }
  console.log(value);
  let query = mysqlConnection.query(sql,[value,a_id],(err, results) => {
    if(err) throw err;
    //redirect("home");
  });
});

//when user submit form to addRoom 
app.post('/editProfile',(req, res) => {
  let u_id = parseInt(req.body.u_id);
  let profileData = {u_name: req.body.u_name,u_gender: req.body.u_gender,u_dob: req.body.u_dob,u_phone: req.body.u_phone,u_email: req.body.u_email};
  console.log(profileData);
  let sql = "UPDATE user SET ? where u_id = ?";
    let query = mysqlConnection.query(sql,[profileData,u_id],(err, results) => {
      if(err) throw err;
      res.redirect("home");
    });
});

//when user submit form to addRoom 
app.post('/editPassword',(req, res) => {
  let u_id = parseInt(req.body.u_id);
  let old_password = CryptoJS.MD5(req.body.old_pwd);
  let password = CryptoJS.MD5(req.body.password);

  console.log(old_password.toString());
  console.log(password.toString());

  let sql = "SELECT * FROM user where u_id = ?";
    let query = mysqlConnection.query(sql,u_id,(err, rows) => {
      if(err) throw err;
      //res.redirect("home");
      rows.forEach((row) => {
        if (old_password.toString() == row.u_password) {
          let sql2 = "UPDATE user SET u_password =? WHERE u_id=?";
            let query2 = mysqlConnection.query(sql2,[password.toString(),u_id],(err2, results) => {
              if(err2) throw err2;
              res.status(200).send({ success: true });
              console.log("Change password successfully!");
            });
        }
        else{
          console.log("Password Incorrect!");
        }
      });
    });
});

app.get("/createMeeting/:u_id&:m_type&:id&:cameraOn", (req, res) => {
  let u_id = parseInt(req.params.u_id);
  let current_time = moment().format("YYYY-MM-DD HH:mm:ss");
  const room= uuidV4(); 
  const id = parseInt(req.params.id); 
  const cameraOn = req.params.cameraOn;
  const m_type = req.params.m_type; 
  var meetingData,mp_type,type;

  if(cameraOn == false){
    mp_type = "audio";
    type = "ring_volume";
  }
  else{
    mp_type = "video";
    type = "video_call";
  }
  var notificationContent;
  var from;
  var to; 
  if(m_type == "conversation"){
    meetingData ={ m_stime:current_time,m_owner_id:u_id,m_code:room,cv_id:id};
    
    /*for notification purpose */
    let sql = "SELECT u1.u_name as username1,u2.u_name as username2, u1.u_id as userid1, u2.u_id as userid2 from conversation cv INNER JOIN user u1 ON (u1.u_id = cv.cv_sender) INNER JOIN user u2 ON (u2.u_id = cv.cv_receiver) WHERE cv_id=? ";
    let query = mysqlConnection.query(sql, [id],(err, rows) => {
    if(err) throw err;

      rows.forEach((row) => {
        if(u_id == row.userid1){
          from = row.username1;
          to = row.userid2;
        }else if(u_id == row.userid2){
          from = row.username2;
          to = row.userid1;
        }
        notificationContent = {
        "notification":"is calling you",
        "from":from,
        "u_id":to,
        "date":current_time,
        "status":"unread",
        "type":type,
        };
        console.log(notificationContent);
        addNotification(notificationContent);
      });
    });
    
  }
  else if (m_type == "channel"){
    meetingData ={m_stime:current_time,m_owner_id:u_id,m_code:room,c_id:id};
    var toList = [];
    var notis;
    /*for notification purpose */
    let sql = "SELECT DISTINCT room.r_id as r_id,r_title, c_title,c_desc,c_id, u1.u_id as userid, u1.u_name as username, room.r_owner_id, u2.u_name as ownername FROM (room INNER JOIN user u2 ON (room.r_owner_id = u2.u_id)) LEFT JOIN room_record ON (room.r_id = room_record.r_id) INNER JOIN user u1 on (room_record.u_id = u1.u_id) INNER JOIN channel ON (channel.r_id = room.r_id) WHERE channel.c_id = ? AND room_record.rr_status ='A'";
    let query = mysqlConnection.query(sql, [id],(err, rows) => {
    if(err) throw err;

      rows.forEach((row) => {
        var venue = row.r_title + " " + row.c_title;
        notis = "has just start a meeting at "+venue;
        if(u_id == row.r_owner_id){
          from = row.ownername;
        }
        if(u_id == row.userid){
          from = row.username;
          toList.push(row.r_owner_id);
        }
        else if(u_id != row.userid) {
          toList.push(row.userid);
        }
        
      });
      notificationContent = {
        "notification":notis,
        "from":from,
        "u_id":toList,
        "date":current_time,
        "status":"unread",
        "type":"video_call",
        };
      console.log(notificationContent);
      addNotification(notificationContent);
    });
  }

  let sql1 = "INSERT INTO meeting SET ?";
  let query1 = mysqlConnection.query(sql1, meetingData,(err, results) => {
    if(err) throw err;
    console.log("Insert Meeting Successfully");
    
    let participantData ={mp_u_id:u_id,mp_join_time:current_time,mp_type:mp_type};
    let sql2 = "INSERT INTO meeting_participant SET ?,m_id=(SELECT max(m_id) FROM meeting)";
    let query2 = mysqlConnection.query(sql2,participantData,(err2, results2) => {
      if(err2) throw err2;
      console.log("Insert Participant Successfully");
      
      res.redirect(`/${room}`);
    });
  });
});

app.get("/deleteChannel/:channel_id", (req, res) => {
  const c_id = parseInt(req.params.channel_id); 
  let sql = "UPDATE channel SET c_status='I' WHERE c_id ="+c_id;
  let query = mysqlConnection.query(sql,(err, results) => {
    if(err) throw err;
    req.session.alertMessage="Channel deleted successfully";
    res.redirect('/home');
  });
});

app.get("/deleteRoom/:room_id", (req, res) => {
  const r_id = parseInt(req.params.room_id); 
  let sql = "UPDATE room SET r_status='I' WHERE r_id ="+r_id;
  let query = mysqlConnection.query(sql,(err, results) => {
    if(err) throw err;
    req.session.alertMessage="Room deleted successfully";
    res.redirect('/home');
  });
});

app.get("/clearHistory/:c_id", (req, res) => {
  const channel_id = parseInt(req.params.c_id);
  let sql1 = "SELECT ch_id FROM channel_message WHERE c_id ="+channel_id;
  let query1 = mysqlConnection.query(sql1,(err1, rows) => {
    if(err1) throw err1;

  rows.forEach((row) => {
    let sql2 = "UPDATE channel_message SET ch_status='I' WHERE ch_id=?";
      let query2 = mysqlConnection.query(sql2,row.ch_id,(err2, results) => {
        if(err2) throw err2;
        console.log("Clear history in channel");

      });
  });
    res.redirect('/home');
  });
});

app.get("/deleteMember/:room_record_id", (req, res) => {
  const rr_id = parseInt(req.params.room_record_id); 
  let sql = "UPDATE room_record SET rr_status='I' WHERE rr_id ="+rr_id;
  let query = mysqlConnection.query(sql,(err, results) => {
    if(err) throw err;
    req.session.alertMessage="Member deleted successfully";
    res.redirect('/home');
  });
});

app.get("/deleteContact/:contact_id", (req, res) => {
  const ct_id = parseInt(req.params.contact_id); 
  let sql = "UPDATE contact SET ct_status='I' WHERE ct_id ="+ct_id;
  let query = mysqlConnection.query(sql,(err, results) => {
    if(err) throw err;
    req.session.alertMessage="Contact deleted successfully";
    console.log(req.session.alertMessage);
    res.redirect('/home');
  });
});

app.get("/deleteAccount/:u_id", (req, res) => {
  const u_id = parseInt(req.params.u_id); 
  let sql = "UPDATE user SET u_status='I' WHERE u_id ="+u_id;
  let query = mysqlConnection.query(sql,(err, results) => {
    if(err) throw err;
    req.session.alertMessage="Account deleted successfully";
    console.log(req.session.alertMessage);
    req.session.destroy();
    res.redirect('/');
  });
});

app.get("/deleteSchedule/:s_id", (req, res) => {
  const s_id = parseInt(req.params.s_id); 
  let sql = "UPDATE schedule SET s_status='I' WHERE s_id ="+s_id;
  let query = mysqlConnection.query(sql,(err, results) => {
    if(err) throw err;
    req.session.alertMessage="Schedule deleted successfully";
    console.log(req.session.alertMessage);
    res.redirect('/home');
  });
});

app.get("/deleteAgenda/:a_id", (req, res) => {
  const a_id = parseInt(req.params.a_id); 
  let sql = "UPDATE agenda SET a_status='I' WHERE a_id ="+a_id;
  let query = mysqlConnection.query(sql,(err, results) => {
    if(err) throw err;
    req.session.alertMessage="Agenda deleted successfully";
    console.log(req.session.alertMessage);
    res.redirect('/home');
  });
});

app.get("/validateName/:roomName", (req, res) => {
  res.status(200).json({ valid: uuidV4Validate(req.params.roomName) });
});

app.get("/joinMeeting/:u_id&:meetingId&:meetingCode", (req, res) => {
  let u_id = parseInt(req.params.u_id);
  let current_time = moment().format("YYYY-MM-DD HH:mm:ss");
  const meetingId = req.params.meetingId; 
  const room = req.params.meetingCode;

  let participantData ={mp_u_id:u_id,mp_join_time:current_time,m_id:meetingId,mp_type:'audio'};
  let sql = "INSERT INTO meeting_participant SET ?";
  let query = mysqlConnection.query(sql,participantData,(err, results) => {
    if(err) throw err2;
    console.log("Insert Participant Successfully");
  });

  res.redirect(`/${room}`);

});

app.get("/joinGuestMeeting/:meetingCode", (req, res) => {
  
  const meetingCode = req.params.meetingCode;
  console.log(meetingCode);

  let sql = "SELECT m_id FROM meeting where m_code = ?";
    let query = mysqlConnection.query(sql,meetingCode,(err, rows) => {
      rows.forEach((row) => {
        const m_id = row.m_id;

       res.render(__dirname + '/views/guest/join-room',{
        roomId:meetingCode,
        m_id:m_id
      }); 

    });
  });

});

app.post('/JoinGuestMeeting/addGuest',(req, res) => {

  let current_time = moment().format("YYYY-MM-DD HH:mm:ss");
  const room = req.body.roomId; 

  let guestData = {g_name: req.body.name, g_gender:req.body.gender,g_date:current_time};
    let sql1 = "INSERT INTO guest SET ?";
    let query1 = mysqlConnection.query(sql1, guestData,(err1, results) => {
      if(err1) throw err1;
      
      console.log("Insert Guest Successfully!");
    });

    let participantData = {mp_join_time:current_time,m_id:req.body.m_id,mp_type:'audio'};
    let sql2 = "INSERT into meeting_participant SET ? , mp_guest_id= (SELECT MAX(g_id) as g_id from guest)";
    let query = mysqlConnection.query(sql2, participantData,(err, results) => {
      if(err) throw err;
      console.log("Insert Participant Successfully!");
    });

    res.redirect(`/${room}`);

    req.session.guestName = req.body.name;
    req.session.save();

});

app.get("/leaveMeeting/:mp_id", (req, res) => {
  let current_time = moment().format("YYYY-MM-DD HH:mm:ss");
  const mp_id = req.params.mp_id; 

  let sql = "UPDATE meeting_participant SET mp_leave_time=? where mp_id = ?";
    let query = mysqlConnection.query(sql,[current_time,mp_id],(err, results) => {
      if(err) throw err;
      console.log("User leave meeting");
    });
});

app.get("/:room", (req, res) => {
  /*const u_id = req.session.u_id;
  const u_name = req.session.u_name;
  const guestName = req.session.guestName;
  //console.log(guestName);


  const roomId = req.params.room;

  console.log("enter room "+roomId);

  if (uuidV4Validate(req.params.room)) {

    var queries = [
      "SELECT m_id,m_stime,u_name as host_name,s_id,c_id,cv_id FROM meeting INNER JOIN user ON (user.u_id = meeting.m_owner_id) WHERE m_code =? AND m_etime IS NULL",
      "SELECT t2.u_name as user_name, t3.g_name as guest_name, t1.mp_join_time, t1.mp_type, t1.m_id, mp_leave_time FROM meeting_participant as t1 LEFT JOIN user as t2 on t1.mp_u_id = t2.u_id LEFT JOIN guest as t3 on t1.mp_guest_id = t3.g_id ORDER BY mp_join_time ASC",
      "SELECT u1.u_name as sender_name, u2.u_name as receiver_name, u1.u_id as sender_id, u2.u_id as receiver_id, u1.u_profilepic as sender_profilepic, u2.u_profilepic as receiver_profilepic,cm_content,cm_datetime,cm_file,chat_message.cv_id as cv_id FROM chat_message INNER JOIN user u1 ON(u1.u_id = chat_message.cm_sender) INNER JOIN user u2 ON(u2.u_id = chat_message.cm_receiver) WHERE cm_sender=? OR cm_receiver=? ORDER BY cm_datetime ASC",
      "SELECT user.u_id as sender_id, user.u_name as sender_name, user.u_profilepic as sender_profilepic, ch_id, ch_content, ch_file, c_id from channel_message INNER JOIN user ON (user.u_id = channel_message.ch_sender_id) WHERE ch_status='A' ORDER BY ch_datetime ASC",
      //"SELECT m_id , COUNT(mp_id) as count FROM meeting_participant WHERE mp_leave_time IS NULL GROUP BY m_id",
    ];
  
    mysqlConnection.query(queries.join(';'),[roomId,u_id,u_id,u_id],(err, results, fields) => {
  
      if (err) throw err;

      /*console.log(results[0]);
      console.log(results[1]);*/
      //console.log(results[2]);
      //console.log(results[3]);
      //console.log(results[1]);*/

      /*res.render('room', {
        moment: moment,
        u_id:u_id,
        u_name:u_name,
        guestName:guestName,
        roomId:roomId,
        meeting: results[0],
        participant : results[1],
        chat_message : results [2],
        channel_message: results [3],
      });
    }); 

  } else {
    res.status(404).json({ error: true, msg: "Room Not found" });
  }*/
  res.render('room');
});

io.on("connection", (socket) => {

  socket.on("join-room", (roomId, userId) => {
    socket.join(roomId);
    socket.to(roomId).broadcast.emit("user-connected", userId);
    socket.on("message", (message) => {
      io.to(roomId).emit("createMessage", message, userId);
    });

    socket.on('disconnect', () => {
      socket.to(roomId).broadcast.emit('user-disconnected', userId)
    })
  });
});

app.post('/insertChannelMessage',(req, res) => {
  let filePath;
  
  if (!req.files || Object.keys(req.files).length === 0) {
    filePath = null;
  }
  else{
    let sampleFile = req.files.channelFile;
    filePath= 'dist/file/' + sampleFile.name;
  }
  
  let current_time = moment().format("YYYY-MM-DD HH:mm:ss");
  var u_id = parseInt(req.body.u_id);
  var c_id = parseInt(req.body.c_id);

  let messageData = {ch_content: req.body.ch_content,ch_file:filePath,ch_datetime:current_time,ch_status:'A',ch_sender_id:u_id,c_id:c_id};
  var toList = [];
  /*for notification purpose */
  let sql = "SELECT DISTINCT room.r_id as r_id,r_title, c_title,c_desc,c_id, u1.u_id as userid, u1.u_name as username, room.r_owner_id, u2.u_name as ownername FROM (room INNER JOIN user u2 ON (room.r_owner_id = u2.u_id)) LEFT JOIN room_record ON (room.r_id = room_record.r_id) INNER JOIN user u1 on (room_record.u_id = u1.u_id) INNER JOIN channel ON (channel.r_id = room.r_id) WHERE channel.c_id = ? AND room_record.rr_status ='A'";
  let query = mysqlConnection.query(sql, [c_id],(err, rows) => {
  if(err) throw err;

    rows.forEach((row) => {
      var venue = row.r_title + " " + row.c_title;
      notis = "has just send a message "+venue;
      if(u_id == row.r_owner_id){
        from = row.ownername;
      }
      if(u_id == row.userid){
        from = row.username;
        toList.push(row.r_owner_id);
      }
      else if(u_id != row.userid) {
        toList.push(row.userid);
      }
      
    });
    notificationContent = {
      "notification":notis,
      "from":from,
      "u_id":toList,
      "date":current_time,
      "status":"unread",
      "type":"chat",
      };
    console.log(notificationContent);
    addNotification(notificationContent);
  });

  let sql1 = "INSERT channel_message SET ?";
    let query1 = mysqlConnection.query(sql1,messageData,(err1, results) => {
      if(err1) throw err1;
      req.session.alertMessage = "Insert Channel Message Successfully!";
      res.redirect("/home");
    });

});

app.get('/upload', function(req, res) {
  let sampleFile;
  let uploadPath;

  if (!req.files || Object.keys(req.files).length === 0) {
    return res.status(400).send('No files were uploaded.');
  }

  // The name of the input field (i.e. "sampleFile") is used to retrieve the uploaded file
  sampleFile = req.files.File;
  uploadPath = __dirname + '/public/dist/file/' + sampleFile.name;

  // Use the mv() method to place the file somewhere on your server
  sampleFile.mv(uploadPath, function(err) {
    if (err)
      return res.status(500).send(err);

    res.send('File uploaded!');
  });
});
function generateNotification(r_id,attendees){
  let current_time = moment().format("YYYY-MM-DD HH:mm:ss");
  
    var toList = [];
    /*for notification purpose */
    let sql = "SELECT DISTINCT room.r_id as r_id,r_title, u1.u_id as userid, u1.u_name as username, room.r_owner_id, u2.u_name as ownername FROM (room INNER JOIN user u2 ON (room.r_owner_id = u2.u_id)) LEFT JOIN room_record ON (room.r_id = room_record.r_id) INNER JOIN user u1 on (room_record.u_id = u1.u_id) WHERE room.r_id = ? AND room_record.rr_status ='A'";
    let query = mysqlConnection.query(sql, [r_id],(err, rows) => {
    if(err) throw err;

      rows.forEach((row) => {
        var venue = row.r_title + " ";
        notis = "has just added you into "+venue;
        from = row.ownername;
        const attendeesIsArray = Array.isArray(attendees);
        if (attendeesIsArray == true){
          for($i=0;$i<attendees.length;$i++) {
          
            if(attendees[$i] != '' && attendees[$i] == row.username)
            {
            toList.push(row.userid);
            }
          }
        }
        else{
          if(attendees != '' && attendees== row.username){
            toList.push(row.userid);
          }
        }
        
      });
      notificationContent = {
        "notification":notis,
        "from":from,
        "u_id":toList,
        "date":current_time,
        "status":"unread",
        "type":"person_add",
        };
      console.log(notificationContent);
      addNotification(notificationContent);
    });
}
function addNotification(notificationContent,req,res) {
  var notification = notificationContent.notification;
  // Make sure it's not a string by accident
  console.log(Array.isArray(notificationContent.u_id));

  var u_id = notificationContent.u_id;
  var from = notificationContent.from;
  var date = notificationContent.date;
  var status = notificationContent.status;
  
  // Put it in the object
  notifications.push(notificationContent);

  // Let the request know it's all set
  var reply = {
    status: 'success',
    notification: notification,
    from:from,
    u_id: u_id,
    date:date,
    status:status,
  }
  console.log('adding: ' + JSON.stringify(reply));
  // Write a file each time we get a new word
  // This is kind of silly but it works
  var json = JSON.stringify(notifications, null, 2);
  fs.writeFile('notifications.json', json, 'utf8', finished);
  function finished(err) {
    console.log('Finished writing json');
    // Don't send anything back until everything is done
    //res.send(reply);
  }
}

// Callback
function showAll(req, res) {
  // Send the entire dataset
  // express automatically renders objects as JSON
  res.send(notifications);
}

server.listen(process.env.PORT || 3030);


