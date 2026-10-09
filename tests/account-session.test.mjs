import test from "node:test";
import assert from "node:assert/strict";
import { resolveInitialUser } from "../account/session.js";

test("un nouveau joueur sans session peut accéder à l'inscription", async () => {
  let getUserCalled = false;
  const result = await resolveInitialUser({
    getSession: async () => ({data:{session:null},error:null}),
    getUser: async () => { getUserCalled = true; throw new Error("AuthSessionMissingError"); },
  });
  assert.equal(result,null);
  assert.equal(getUserCalled,false);
});
test("un compte déjà connecté est vérifié auprès du serveur Auth", async () => {
  let verified = false;
  const result = await resolveInitialUser({
    getSession: async () => ({data:{session:{user:{id:"cached"}}},error:null}),
    getUser: async () => {verified=true; return {data:{user:{id:"server-user",email:"joueur@example.test"}},error:null};},
  });
  assert.equal(verified,true);
  assert.equal(result.id,"server-user");
});
test("une session présente mais invalide ne connecte pas un faux joueur",async()=>{
  const result=await resolveInitialUser({
    getSession:async()=>({data:{session:{access_token:"old"}},error:null}),
    getUser:async()=>({data:{user:null},error:new Error("expired")}),
  });
  assert.equal(result,null);
});
test("une réelle panne de session peut être signalée",async()=>{
  await assert.rejects(
    resolveInitialUser({getSession:async()=>({data:null,error:new Error("network unavailable")})}),
    /network unavailable/
  );
});
