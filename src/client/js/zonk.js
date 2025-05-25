import "../sass/zonk.scss";
import modal from "./helper/modal.js";
import xhr from "./helper/xhr.js";

let isLocked = false;
const userlist = document.querySelector(".userlist");

function userDetail(usr) {
  return `${usr.uname} (ID${usr.id})<br/>${usr.peer ? usr.peer : "offline"}<br/><br/>${usr.data.email || "email is private"}<br/>${usr.data.provider} - ${usr.data.id || usr.id}<br/><br/>Joined:<br/>${new Date(usr.j).toLocaleString()}`;
}

async function peekUser(usr) {
  if(isLocked) return;
  isLocked = true;
  await modal.alert(userDetail(usr));
  isLocked = false;
}

function userCard(usr) {
  const card = document.createElement("div");
  card.classList.add("card")
  card.innerHTML = `<div class="usr username">${usr.uname}</div><div class="usr userid">${usr.id}</div>`;
  card.onclick = () => peekUser(usr);
  return card;
}
function clearUsers() {
  while (userlist.lastChild) {
    userlist.lastChild.remove();
  }
}

function writeUsers(users) {
  users.forEach(usr => {
    userlist.append(userCard(usr));
  })
}

async function searchUsers(userid) {
  if(isLocked) return;
  isLocked = true;
  if(userid.length < 4) {
    await modal.alert("Please enter minimum 4 characters");
    isLocked = false;
    return;
  }
  const getUsers = await modal.loading(xhr.get(`/x/admin/zonk/users/${userid}`));
  if(!getUsers || !getUsers.data) {
    await modal.alert("Something went wrong");
    isLocked = false;
    return;
  }
  clearUsers();
  writeUsers(getUsers.data.users);
  isLocked = false;
}

function formListener() {
  const form = document.querySelector(".search-menu");
  form.onsubmit = e => {
    e.preventDefault();
    const formData = new FormData(form);
    let userid = "online";
    formData.forEach((val, _) => userid = val);
    searchUsers(userid);
  }
}

window.onload = () => {
  searchUsers("online");
  formListener();
}
/*
@username
<br>
userid
<br>
peerid
<br>
<br>
example:
<br>
example@example.com
<br>
23974928347
*/