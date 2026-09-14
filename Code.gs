const SPREADSHEET_ID = 'PASTE_YOUR_GOOGLE_SHEET_ID_HERE';
const OPERATOR_KEY = 'CHANGE_THIS_TO_A_LONG_RANDOM_SECRET';

function setup() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheets = {
    Events: ['Event ID','Name','Description','Place','Date & Time','Confirmed','Capacity','Status','Created At'],
    Signups: ['Signup ID','Event ID','Event','Parent/Guardian','Child/Participant','Email','Phone','Signed Up'],
    Announcements: ['Announcement ID','Title','Message','Date Posted','Active']
  };
  Object.keys(sheets).forEach(name=>{
    let sh=ss.getSheetByName(name)||ss.insertSheet(name);
    if(sh.getLastRow()===0) sh.appendRow(sheets[name]);
    sh.setFrozenRows(1);
  });
}
function json(o){return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON)}
function doPost(e){try{const x=JSON.parse(e.postData.contents||'{}');switch(x.action){case 'getPublicData':return getPublicData();case 'operatorCheck':auth(x);return json({ok:true});case 'addEvent':auth(x);return addEvent(x);case 'addAnnouncement':auth(x);return addAnnouncement(x);case 'signup':return signup(x);case 'getSignups':auth(x);return getSignups();default:throw Error('Unknown action')}}catch(err){return json({ok:false,error:String(err.message||err)})}}
function auth(x){if(x.operatorKey!==OPERATOR_KEY)throw Error('Invalid operator key.')}
function sh(n){return SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(n)}
function rows(n){const s=sh(n),v=s.getDataRange().getValues();return v.length>1?v.slice(1):[]}
function getPublicData(){const ev=rows('Events').map(r=>({id:r[0],name:r[1],description:r[2],place:r[3],date:r[4],confirmed:Number(r[5]||0),capacity:r[6],status:r[7]}));const an=rows('Announcements').filter(r=>r[4]!==false).map(r=>({id:r[0],title:r[1],body:r[2],createdAt:r[3]}));return json({ok:true,events:ev,announcements:an})}
function addEvent(x){if(!x.name||!x.description||!x.place||!x.date)throw Error('Complete all event fields.');const s=sh('Events'),id='EVT-'+Utilities.getUuid().slice(0,8).toUpperCase();s.appendRow([id,x.name,x.description,x.place,new Date(x.date),0,x.capacity?Number(x.capacity):'', 'Open',new Date()]);return json({ok:true,id})}
function addAnnouncement(x){if(!x.title||!x.body)throw Error('Complete the notification.');const s=sh('Announcements'),id='N-'+Utilities.getUuid().slice(0,8).toUpperCase();s.appendRow([id,x.title,x.body,new Date(),true]);return json({ok:true,id})}
function signup(x){if(!x.eventId||!x.parent||!x.child||!x.email)throw Error('Please complete the required signup fields.');const ss=SpreadsheetApp.openById(SPREADSHEET_ID),s=sh('Signups'),ev=sh('Events'),data=ev.getDataRange().getValues();let row=-1,eventName='',capacity='',confirmed=0;for(let i=1;i<data.length;i++)if(String(data[i][0])===String(x.eventId)){row=i+1;eventName=data[i][1];confirmed=Number(data[i][5]||0);capacity=data[i][6];break}if(row<0)throw Error('Event not found.');if(capacity&&confirmed>=Number(capacity))throw Error('This event is full.');const sr=s.getDataRange().getValues();for(let i=1;i<sr.length;i++)if(String(sr[i][1])===String(x.eventId)&&String(sr[i][5]).toLowerCase()===String(x.email).toLowerCase())throw Error('That email is already signed up for this event.');const id='S-'+Utilities.getUuid().slice(0,8).toUpperCase();s.appendRow([id,x.eventId,eventName,x.parent,x.child,x.email,x.phone||'',new Date()]);ev.getRange(row,6).setValue(confirmed+1);return json({ok:true,id})}
function getSignups(){const a=rows('Signups').map(r=>({id:r[0],eventId:r[1],event:r[2],parent:r[3],child:r[4],email:r[5],phone:r[6],createdAt:r[7]}));return json({ok:true,signups:a})}
