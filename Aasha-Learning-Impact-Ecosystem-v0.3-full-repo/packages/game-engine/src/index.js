import { id } from '../../shared-types/src/index.js';
export class GameEngine {
  constructor({questions,mode='practice',onEnd=()=>{}}){this.questions=[...questions];this.mode=mode;this.onEnd=onEnd;this.index=0;this.score=0;this.attempts=[];this.sessionId=id();}
  current(){return this.questions[this.index]??null;}
  answer(answerIndex){const q=this.current(); if(!q) return null; const correct=Number(answerIndex)===Number(q.answerIndex); const a={eventId:id(),questionId:q.id,nodeId:q.nodeId,correct,at:new Date().toISOString(),sessionId:this.sessionId}; this.attempts.push(a); if(correct)this.score+=q.points??1; this.index++; if(this.index>=this.questions.length)this.onEnd({sessionId:this.sessionId,score:this.score,attempts:this.attempts}); return a;}
}
