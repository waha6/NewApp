const config = {
    apiKey: "AIzaSyDaQT4TZzbbVZUEUBvzrUPk6DDecxcbQAw",
    authDomain: "olx-pwapp.firebaseapp.com",
    databaseURL: "https://olx-pwapp.firebaseio.com",
    projectId: "olx-pwapp",
    storageBucket: "olx-pwapp.appspot.com",
    messagingSenderId: "1085851231788"
};
var storage, storageRef, db, uzer,user ;
function firebaseConfig() {
    storage = firebase.storage();
    storageRef = storage.ref();
    firebase.firestore().settings({timestampsInSnapshots: true})
    firebase.firestore().enablePersistence();
    db = firebase.firestore();
    uzer = firebase.auth().currentUser;
    user = (localStorage['user'])?JSON.parse(localStorage['user']):null;
}
function openNav(t) {
    t.classList.remove('hide');
}

function closeNav(t) {
    t.classList.add('hide');
}
async function myAccount() {
    let req = await fetch("../assests/login.json");
    let json = await req.json();
    document.querySelector(".container").innerHTML = "" + ((page == 'register') ? json.register : (page == 'login') ? json.login : "");
}
function addScript(file) {
    var imported = document.createElement('script');
    imported.src = file;
    document.head.appendChild(imported);
}
function submitloginform() {
    let form = document.querySelector('.login-form');
    let mail = form.mail.value;
    let pass = form.pass.value
    firebase.auth().signInWithEmailAndPassword(mail, pass).then(async (u) => {
            uzer = firebase.auth().currentUser;
            let uobj;
            if (u) {
                console.log('start')
                await db.collection('users').doc(uzer.displayName).get().then(r => {
                    uobj = r.data()
                })
                console.log(uobj)
                localStorage.setItem('user', JSON.stringify(uobj));
                console.log("finish");
            } 
        form.reset();
        // window.location.assign('.');
        return false;
    }).catch(function (error) {
        setError(error.message, 3000);
    });
    return false;
}

function logout(item) {
    firebase.auth().signOut();
    localStorage.clear();
    item.style.display = "none";
    window.location.assign("./?page=category");
}
async function submitAd() {
    if (localStorage.getItem("user")) {
        let req = await fetch("../assests/submitads.json");
        let json = await req.json();
        let con = document.querySelector(".container");
        con.innerHTML = "" + json.data;
    } else {
        window.location.assign("./?page=login");
    }
}
async function submitPushAd() {
    console.log("done");
    uzer = firebase.auth().currentUser;
	let u = JSON.parse(localStorage.getItem('user'));
    let form = document.querySelector('.ads-form');
    let title = form.title.value;
    let cat = document.querySelector('#category').value;
    let descrip = form.description.value;
    let pric = form.price.value;
    let img = "";
    let stored = await storageRef.child(`adimg/${form.pic.files[0].name}/`);
    let snap = await stored.put(form.pic.files[0]);
    let snapshot = await snap.ref.getDownloadURL().then(url => {
        img = url;
        console.log(url);
    })
    db.collection('ads').add({
        "uid": uzer.displayName,
        "uname": u.uname,
        "phone": u.phonenumber,
        "title": title,
        "category": cat,
        "description": descrip,
        "phone": u.phonenumber,
        "imageURL": img,
        "price": "Rs:" + pric
    }).then(ad =>{
        updateUser(uzer.displayName,"adsid",ad.id);
    });
    form.reset();
}
function updateUser(id,name,value,second){
	let data = db.collection('users').doc(id);
	data.get().then(r=>r.data()).then(a=>(second)?a[name][second]:a[name]).then(a=>{
    a.push(value);
    let j = JSON.parse(localStorage['user']);
    j[name]=a;
    localStorage['user']=JSON.stringify(j);
	data.update({
		"adsid":a
	})
	});
}
function adPage(){
    let id =locationVar('adid');
    db.collection('ads').doc(id).get()
}
function pageLoad(pg) {
    if (pg === "category")
        homepage();
    else if (pg === "homepage")
        homepage();
    else if (pg === "submitad")
        submitAd();
    else if (pg === "login")
        myAccount();
    else if (pg === "register") {
        myAccount();
    }else if (pg === "ad") {
        adPage();
    }else if (pg === "search") {
        search();
    }
}
function homepage() {
    let con = document.querySelector('.container');
    db.collection('ads').get().then(r=>{
        if(!con.querySelector('main'))
            con.innerHTML='<main></main>'
        let m =document.querySelector('main');
        r.forEach(s=>{
        m.innerHTML += adBox(s.id,s.data());
    })});        
}
function submitcreateform() {
    var form = document.querySelector('.register-form');
    var mail = form.mail.value;
    var pass = form.pass.value
    firebase.auth().createUserWithEmailAndPassword(mail, pass).then(user => {
        uzer = firebase.auth().currentUser;
        let uobj = {
            "adsid": [],
            "favoriteads": [],
            "messages": {
                "messages": {
                    "messagecontent": [],
                    "senderid": []
                },
                "sendmessages": {
                    "messagecontent": [],
                    "recieverid": []
                }
            },
            "phonenumber": "+92" + form.phone.value,
            "uemail": uzer.email,
            "uid": uzer.uid,
            "uname": form.name.value
        };
        db.collection("users").add(uobj).then(async res => {
            uzer.updateProfile({
                displayName: res.id
            });
            localStorage.setItem("user", JSON.stringify(uobj));
            form.reset();
            window.location.assign("./?page=category");
        });
        return false;
    }).catch((error) => {
        setError(error.message, 3000)
    });
    return false;
}

function setError(errorMessage, time) {
    var err = document.querySelector('#err');
    setTimeout(() => {
        closeNav(err)
    }, time);
    openNav(err);
    document.querySelector('#errmessage').innerHTML = errorMessage;
}
async function json(file) {
    return await fetch(file).then(r=>r.json());
}
function locationVar(st){
    let n;
    window.location.search.substring(1).split("&").forEach(s => {
        let v = s.split("=");
        if(st==v[0])
            n=v[1];
    });
    return n || null;
}
function adBox(id,content){
    return `<div class="box" id="${id}" onclick="window.location.assign('./?page=ad&adid=${id}')"><div class="adtitle"><h1>${content.title}</h1></div><div class="aduser f50"><div class="f50"><div>${content.uname}</div><div>${content.phone}</div></div><div><h2>${content.price}</h2></div></div><div class="adimg"><img src="${content.imageURL}" width="100%" height="100%"></div><div class="addesciption">${content.description}</div><div class="adoffline"><div>${content.category}</div><a href="./hello"><img src="./images/favorite.svg" width="10%"></a></div></div>`;
}
function search(){
    let text = locationVar("text")||'';
    let cat = locationVar("cat");
    let con = document.querySelector('.container');
    con.innerHTML='<div class="man"><div class="loader"></div></div>';
    if(cat=='all'){
        db.collection('ads').get().then(r=>{
            if(!con.querySelector('main'))
                con.innerHTML='<main></main>'
            let m =document.querySelector('main');
            r.forEach(s=>{
            let d =s.data();
            if(d.title.toLowerCase().indexOf(text.toLowerCase())!=-1)
                m.innerHTML += adBox(s.id,d);
        })});   
    }else{
        db.collection('ads').where('category','==',cat).get().then(r=>{
            if(!con.querySelector('main'))
                con.innerHTML='<main></main>'
            let m =document.querySelector('main');
            console.log(r);
            r.forEach(s=>{
            let d =s.data();
            if(d.title.toLowerCase().indexOf(text.toLowerCase())!=-1)
                m.innerHTML += adBox(s.id,d);
        })});
    }

}
// service worker
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register("sw.js").then(function () {
        console.log('SW Registerd')
    }, function () {
        console.log('SW Registration Failed')
    })
} else {
    console.log('SW Not Supported')
}
//Executing Code
firebase.initializeApp(config);
firebaseConfig();