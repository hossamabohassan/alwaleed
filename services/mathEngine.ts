import { Difficulty, Operation, Question } from '../types';

function getRandomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function shuffleArray(array: number[]) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

// Helper to format text for Audio/TTS
export function getQuestionAudioText(q: Question): string {
    return q.text
        .replace('؟', 'كم يساوي')
        .replace('×', 'ضرب')
        .replace('÷', 'قسمة')
        .replace('+', 'زائد')
        .replace('-', 'ناقص');
}

export function generateQuestion(operation: Operation, difficulty: Difficulty, selectedTable: number | null = null): Question {
  let a = 0, b = 0, answer = 0;
  let symbol = '';
  let isMissingOperand = false;

  // Reduce chance of missing operand to 20% only for Medium/Hard mixed games
  if (!selectedTable && difficulty !== Difficulty.EASY && Math.random() > 0.8) {
    isMissingOperand = true;
  }

  switch (operation) {
    case 'multiplication':
      symbol = '×';
      if (selectedTable) {
          // Specific Table Logic (e.g. Table 5)
          // Always use the selected table as one operand
          const otherOperand = getRandomInt(1, 10); // 2x1 to 2x10
          if (Math.random() > 0.5) {
              a = selectedTable;
              b = otherOperand;
          } else {
              a = otherOperand;
              b = selectedTable;
          }
      } else {
          // Classic Difficulty Logic
          if (difficulty === Difficulty.EASY) {
            a = getRandomInt(2, 5);
            b = getRandomInt(2, 5);
          } else if (difficulty === Difficulty.MEDIUM) {
            a = getRandomInt(3, 9);
            b = getRandomInt(3, 9);
          } else {
            a = getRandomInt(6, 12);
            b = getRandomInt(4, 9);
          }
      }
      answer = a * b;
      break;

    case 'division':
      symbol = '÷';
      if (selectedTable) {
          // Division Table Logic (e.g. Table 2 means dividing by 2)
          // Logic: (Table * Random) / Table = Random
          const multiplier = getRandomInt(1, 10);
          b = selectedTable; // Divisor is the table number
          a = b * multiplier; // Dividend
          answer = multiplier;
      } else {
          let divA = 0, divB = 0;
          if (difficulty === Difficulty.EASY) {
            divA = getRandomInt(2, 5);
            divB = getRandomInt(2, 5);
          } else if (difficulty === Difficulty.MEDIUM) {
            divA = getRandomInt(3, 9);
            divB = getRandomInt(3, 9);
          } else {
            divA = getRandomInt(4, 9);
            divB = getRandomInt(6, 12);
          }
          answer = divA; 
          b = divB;
          a = divA * divB; 
      }
      break;

    case 'addition':
      symbol = '+';
      if (difficulty === Difficulty.EASY) {
        a = getRandomInt(5, 20);
        b = getRandomInt(5, 20);
      } else if (difficulty === Difficulty.MEDIUM) {
        a = getRandomInt(20, 100);
        b = getRandomInt(20, 100);
      } else {
        a = getRandomInt(100, 500);
        b = getRandomInt(100, 500);
      }
      answer = a + b;
      break;

    case 'subtraction':
      symbol = '-';
      if (difficulty === Difficulty.EASY) {
        a = getRandomInt(10, 30);
        b = getRandomInt(1, a - 1);
      } else if (difficulty === Difficulty.MEDIUM) {
        a = getRandomInt(50, 150);
        b = getRandomInt(10, a - 10);
      } else {
        a = getRandomInt(200, 1000);
        b = getRandomInt(50, a - 50);
      }
      answer = a - b;
      break;
  }

  const answers = new Set<number>();
  answers.add(answer);

  while (answers.size < 4) {
    const offset = getRandomInt(1, 5);
    const sign = Math.random() > 0.5 ? 1 : -1;
    let fake = answer + (offset * sign);
    if (fake < 0) fake = Math.abs(fake);
    if (fake === answer) fake = answer + 1;
    answers.add(fake);
  }

  const answersArray = Array.from(answers);
  shuffleArray(answersArray);

  if (isMissingOperand) {
    const hideA = Math.random() > 0.5;
    // For specific tables, usually keep it simple "a x b = ?", but we can support missing if desired
    // For now, if selectedTable is active, we disabled missingOperand above to keep it focused on the table memorization
    return generateSpecificMissingQuestion(a, [], b, answer, symbol, true); 
  }

  const text = `${a} ${symbol} ${b} = ؟`;

  return {
    text,
    operandA: a,
    operandB: b,
    correctAnswer: answer,
    answers: answersArray,
    isMissingOperand: false
  };
}

function generateSpecificMissingQuestion(
    correctVal: number, 
    _unusedOriginalAnswers: number[], 
    knownVal: number, 
    resultVal: number, 
    symbol: string,
    hideFirst: boolean
): Question {
    const answers = new Set<number>();
    answers.add(correctVal);
    while(answers.size < 4) {
        let offset = getRandomInt(1, 5);
        if (correctVal > 10) offset = getRandomInt(1, 10);
        const sign = Math.random() > 0.5 ? 1 : -1;
        let fake = correctVal + (offset * sign);
        if (fake < 0) fake = 0;
        if (fake === correctVal) fake = correctVal + 1;
        answers.add(fake);
    }
    const finalAnswers = Array.from(answers);
    shuffleArray(finalAnswers);

    let text = "";
    if (hideFirst) {
        text = `؟ ${symbol} ${knownVal} = ${resultVal}`;
    } else {
        text = `${knownVal} ${symbol} ؟ = ${resultVal}`;
    }

    return {
        text,
        operandA: 0, 
        operandB: 0,
        correctAnswer: correctVal,
        answers: finalAnswers,
        isMissingOperand: true
    };
}

export function getEducationalHint(q: Question): string {
    const isMult = q.text.includes('×');
    const isDiv = q.text.includes('÷');

    if (isMult) {
        return `الضرب في ${q.operandA} أو ${q.operandB} يعني تكرار الجمع. حاول العد بالقفز!`;
    }
    if (isDiv) {
        return `القسمة على ${q.operandB} تعني: كم ${q.operandB} موجودة في الرقم ${q.operandA}؟`;
    }
    return "حاول مرة أخرى!";
}