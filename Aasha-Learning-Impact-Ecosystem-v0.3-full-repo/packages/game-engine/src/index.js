import { id } from '../../shared-types/src/index.js';
import { gradeQuestion } from '../../question-engine/src/index.js';

export class GameEngine {
  constructor({questions,mode='practice',onEnd=()=>{}}){this.questions=[...questions];this.mode=mode;this.onEnd=onEnd;this.index=0;this.score=0;this.attempts=[];this.sessionId=id();}
  current(){return this.questions[this.index]??null;}
  answer(answerIndex){
    const q=this.current();
    if(!q) return null;
    const grade = gradeQuestion(q, answerIndex);
    const a={
      eventId:id(),
      questionId:q.id,
      nodeId:q.nodeId,
      correct:grade.correct,
      score:grade.score,
      feedback:grade.feedback,
      misconceptionId:grade.misconceptionId,
      at:new Date().toISOString(),
      sessionId:this.sessionId
    };
    this.attempts.push(a);
    if(grade.correct) this.score += grade.score;
    this.index++;
    if(this.index>=this.questions.length) this.onEnd({sessionId:this.sessionId,score:this.score,attempts:this.attempts});
    return a;
  }
}
