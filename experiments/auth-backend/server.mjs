// Experimental PSBox-style MSA device-code auth backend.
// Run with Node 22+: NIMBO_MSA_CLIENT_ID=<registered-public-client-id> node server.mjs
// No third-party Xbox client IDs are bundled. Never expose this server without HTTPS and access controls.
import http from 'node:http';
import { randomBytes } from 'node:crypto';

const CLIENT_ID = process.env.NIMBO_MSA_CLIENT_ID;
const SCOPE = process.env.NIMBO_MSA_SCOPE || 'service::user.auth.xboxlive.com::MBI_SSL';
const HOST = process.env.NIMBO_HOST || '127.0.0.1';
const PORT = Number(process.env.PORT || 8787);
const ORIGIN = process.env.NIMBO_ORIGIN || 'http://127.0.0.1:8787';
if (!CLIENT_ID) { console.error('Set NIMBO_MSA_CLIENT_ID to your own authorized public client ID'); process.exit(1); }
const sessions = new Map();
const form = (fields) => new URLSearchParams(fields);
async function post(url, data) {
  const response = await fetch(url, {method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:form(data),signal:AbortSignal.timeout(15000)});
  const payload = await response.json().catch(()=>({}));
  return {status:response.status,payload};
}
function send(res,status,obj,headers={}) {
  res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff',...headers});
  res.end(JSON.stringify(obj));
}
function cookie(req){return /(?:^|; )nimbo_probe=([a-f0-9]{64})(?:;|$)/.exec(req.headers.cookie||'')?.[1];}
function xboxError(e){return e?.error || e?.error_description || 'request_failed';}
const pending = new Set();
const server=http.createServer(async(req,res)=>{
  if(req.headers.origin && req.headers.origin!==ORIGIN) return send(res,403,{error:'origin_not_allowed'});
  if(!['GET','POST'].includes(req.method))return send(res,405,{error:'method_not_allowed'});
  const pathname=new URL(req.url,'http://localhost').pathname;
  if(pathname==='/health' && req.method==='GET')return send(res,200,{ready:true,mode:'local-only',configured:true});
  if(pathname==='/auth/start' && req.method==='POST'){
    if(pending.size>=10)return send(res,429,{error:'too_many_pending'});
    try{
      const result=await post('https://login.live.com/oauth20_connect.srf',{client_id:CLIENT_ID,scope:SCOPE,response_type:'device_code'});
      if(result.status!==200||!result.payload.device_code)return send(res,502,{error:'msa_device_code_rejected',httpStatus:result.status,reason:xboxError(result.payload)});
      const sid=randomBytes(32).toString('hex'),d=result.payload;
      const expires=Math.min(Number(d.expires_in)||900,1800);
      sessions.set(sid,{deviceCode:d.device_code,interval:Math.max(5,Number(d.interval)||5),nextPoll:0,expires:Date.now()+expires*1000,state:'pending'});
      pending.add(sid);
      return send(res,200,{userCode:d.user_code,verificationUri:d.verification_uri||'https://www.microsoft.com/link',expiresIn:expires,interval:Math.max(5,Number(d.interval)||5)}, {'Set-Cookie':`nimbo_probe=${sid}; HttpOnly; SameSite=Strict; Path=/auth; Max-Age=${expires}${ORIGIN.startsWith('https:')?'; Secure':''}`});
    }catch{return send(res,502,{error:'msa_network_error'});}
  }
  if(pathname==='/auth/status' && req.method==='POST'){
    const sid=cookie(req),s=sessions.get(sid);
    if(!s)return send(res,401,{error:'no_session'});
    if(Date.now()>s.expires){sessions.delete(sid);pending.delete(sid);return send(res,410,{error:'expired'});}
    if(s.state!=='pending')return send(res,200,{state:s.state});
    if(Date.now()<s.nextPoll)return send(res,429,{error:'slow_down',retryAfter:Math.ceil((s.nextPoll-Date.now())/1000)});
    s.nextPoll=Date.now()+s.interval*1000;
    try{
      const t=await post('https://login.live.com/oauth20_token.srf',{client_id:CLIENT_ID,device_code:s.deviceCode,grant_type:'urn:ietf:params:oauth:grant-type:device_code'});
      if(t.payload.error==='authorization_pending')return send(res,200,{state:'pending'});
      if(t.payload.error==='slow_down'){s.interval+=5;return send(res,429,{error:'slow_down',retryAfter:s.interval});}
      if(t.status!==200||!t.payload.access_token){s.state='rejected';pending.delete(sid);return send(res,400,{error:'msa_rejected',reason:xboxError(t.payload)});}
      // Do not expose tokens or persist refresh tokens. This first milestone only proves MSA issuance.
      s.state='msa_ok';pending.delete(sid);
      return send(res,200,{state:'msa_ok',note:'MSA token issued; Xbox Live/XSTS not yet tested'});
    }catch{return send(res,502,{error:'msa_network_error'});}
  }
  if(pathname==='/auth/logout'&&req.method==='POST'){
    const sid=cookie(req);sessions.delete(sid);pending.delete(sid);
    return send(res,200,{signedOut:true},{'Set-Cookie':'nimbo_probe=; HttpOnly; SameSite=Strict; Path=/auth; Max-Age=0'});
  }
  send(res,404,{error:'not_found'});
});
server.listen(PORT,HOST,()=>console.log('MSA diagnostic listening on '+HOST+':'+PORT+' (local only)'));
