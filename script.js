// 1. YOUR UNIQUE FIREBASE URL
const FB_URL = "https://1bsef-e852e-default-rtdb.firebaseio.com/"; 

let db = {
    users: [
        { name: "Mehdi Amouhiy", code: "password", role: "admin", lastLogin: "Never" },
        { name: "Ahmed Ennagi", code: "Porsche turbo s", role: "student", lastLogin: "Never" }
    ],
    schedule: [
        ["8:30-9:30", "","","","","",""], ["9:30-10:30", "","","","","",""],
        ["10:30-11:30", "","","","","",""], ["11:30-12:30", "","","","","",""],
        ["14:30-15:30", "","","","","",""], ["15:30-16:30", "","","","","",""],
        ["16:30-17:30", "","","","","",""], ["17:30-18:30", "","","","","",""]
    ],
    exams: [], homework: [], teachers: []
};

let currentUser = null;

const app = {
    // Pushes all changes to the Cloud
    save: async () => {
        try {
            await fetch(`${FB_URL}/data.json`, {
                method: 'PUT',
                body: JSON.stringify(db)
            });
        } catch (e) { console.error("Save failed", e); }
    },

    // Pulls freshest data from the Cloud
    load: async () => {
        try {
            const res = await fetch(`${FB_URL}/data.json`);
            const remote = await res.json();
            if (remote) {
                db = remote;
                if (currentUser) app.render(window.currentView || 'schedule');
            }
        } catch (e) { console.error("Load failed", e); }
    },

    login: async () => {
        const input = document.getElementById('auth-code');
        const code = input.value;
        await app.load(); 
        
        const userIndex = db.users.findIndex(u => u.code === code);
        if (userIndex !== -1) {
            currentUser = db.users[userIndex];
            db.users[userIndex].lastLogin = new Date().toLocaleString('en-GB', { day:'2-digit', month:'short', hour:'2-digit', minute:'2-digit' });
            await app.save(); 
            
            document.getElementById('login-screen').classList.remove('active');
            document.getElementById('main-app').classList.add('active');
            document.getElementById('user-name').innerText = currentUser.name.split(' ')[0];
            
            if (currentUser.role === 'admin') {
                document.getElementById('admin-panel').classList.remove('hidden');
                document.querySelectorAll('.admin-only').forEach(el => el.style.display = 'block');
            }
            app.navigate('schedule');
            
            // Auto-refresh every 15 seconds
            setInterval(app.load, 15000); 
        } else {
            document.getElementById('login-error').style.display = 'block';
        }
    },

    navigate: (view) => {
        window.currentView = view;
        document.querySelectorAll('.view').forEach(v => v.classList.add('hidden'));
        document.getElementById(`view-${view}`).classList.remove('hidden');
        document.getElementById('dropdown').classList.remove('active');
        app.render(view);
    },

    render: (view) => {
        const isAdmin = currentUser && currentUser.role === 'admin';
        
        if (view === 'schedule') {
            const body = document.getElementById('schedule-body');
            body.innerHTML = `<tr><th>Session</th><th>Mon</th><th>Tue</th><th>Wed</th><th>Thu</th><th>Fri</th><th>Sat</th></tr>`;
            db.schedule.forEach((row, rIdx) => {
                let tr = `<tr><td style="font-weight:700; color:#adb5bd; background:rgba(0,0,0,0.2)">${row[0]}</td>`;
                for(let cIdx=1; cIdx<=6; cIdx++) {
                    const cellVal = row[cIdx] || "-";
                    const edit = isAdmin ? `class="admin-editable-cell" onclick="app.editCell(${rIdx},${cIdx})"` : '';
                    tr += `<td ${edit}>${cellVal}</td>`;
                }
                body.innerHTML += tr + `</tr>`;
            });
        } 
        else if (view === 'students' && isAdmin) {
            const body = document.getElementById('student-list-body');
            body.innerHTML = '';
            db.users.forEach((u, i) => {
                const isSelf = u.code === currentUser.code;
                const actions = isSelf ? '--' : `
                    ${u.role !== 'admin' ? `<button class="btn-action btn-promote" onclick="app.promote(${i})">Admin</button>` : ''}
                    <button class="btn-action btn-delete" onclick="app.delStudent(${i})">Del</button>`;
                body.innerHTML += `<tr><td>${u.name} ${u.role==='admin'?'<span class="badge-admin">ADM</span>':''}</td><td style="color:#f39c12">${u.code}</td><td>${u.role}</td><td>${u.lastLogin}</td><td>${actions}</td></tr>`;
            });
        }
        else if (['exams', 'homework', 'teachers'].includes(view)) {
            const container = document.getElementById(`${view}-container`);
            container.innerHTML = db[view].length ? '' : `<div style="text-align:center; padding:40px; color:#666;">Nothing here. Chill day!</div>`;
            db[view].forEach((item, index) => {
                const del = isAdmin ? `<button class="delete-btn" onclick="app.delItem('${view}',${index})"><i class="fas fa-trash"></i></button>` : '';
                container.innerHTML += `<div class="card glass ${item.status === 'Confirmed Exam' ? 'status-confirmed' : ''}">
                    ${del}<h4>${item.subject || item.name}</h4><p>${item.lessons || item.description || ''}</p>
                    <div style="margin-top:10px;"><span class="btn-outline">${item.status || item.deadline || item.duration}</span></div>
                </div>`;
            });
        }
    },

    editCell: async (r, c) => {
        const val = prompt("New Subject:", db.schedule[r][c]);
        if (val !== null) { db.schedule[r][c] = val; await app.save(); app.render('schedule'); }
    },
    delItem: async (cat, i) => { if(confirm("Delete?")) { db[cat].splice(i,1); await app.save(); app.render(cat); } },
    promote: async (i) => { if(confirm("Promote to Admin?")) { db.users[i].role = 'admin'; await app.save(); app.render('students'); }},
    delStudent: async (i) => { if(confirm("Remove student?")) { db.users.splice(i,1); await app.save(); app.render('students'); }},
    addStudent: async () => {
        const name = prompt("Name:"); if(!name) return;
        const code = Math.random().toString(36).substring(2,8).toUpperCase();
        db.users.push({name, code, role:'student', lastLogin:'Never'});
        await app.save(); app.render('students'); alert(`Code: ${code}`);
    },
    addExam: async () => {
        const s = prompt("Subject:"); if(!s) return;
        const st = prompt("1: Possible, 2: Confirmed") == '2' ? "Confirmed Exam" : "Possible Exam";
        db.exams.push({subject:s, lessons:prompt("Lessons:"), status:st}); 
        await app.save(); app.render('exams');
    },
    addHomework: async () => {
        const s = prompt("Subject:"); if(!s) return;
        db.homework.push({subject:s, description:prompt("Details:"), deadline:prompt("Deadline:")}); 
        await app.save(); app.render('homework');
    },
    addAbsence: async () => {
        const n = prompt("Teacher Name:"); if(!n) return;
        db.teachers.push({name:n, duration:prompt("Duration:")}); 
        await app.save(); app.render('teachers');
    },
    logout: () => location.reload()
};

document.getElementById('auth-code').addEventListener('keypress', e => { if(e.key==='Enter') app.login(); });
