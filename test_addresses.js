async function go(){
  const base = 'http://localhost:3000';
  const login = await fetch(`${base}/api/auth/login`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:'test2@example.com',password:'password123'})});
  const li = await login.json();
  console.log('login', li);
  if(!login.ok) return;
  const token = li.accessToken;
  const add = await fetch(`${base}/api/account/addresses`,{method:'POST',headers:{'Content-Type':'application/json',Authorization:`Bearer ${token}`},body:JSON.stringify({city:'Cairo',area:'Nasr City',details:'Block 4, Apt 12',is_default:true})});
  console.log('create', await add.json());
  const list = await fetch(`${base}/api/account/addresses`,{headers:{Authorization:`Bearer ${token}`}});
  console.log('list', await list.json());
}

go().catch(console.error);


