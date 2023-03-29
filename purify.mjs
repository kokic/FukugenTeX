
import {
  token,
  character,
  includes,
  inclusive,
  soft,
  string,
  digits,
  letter,
  letters,
  state,
  space,
} from "./src/parsec.mjs"

const underlineOrDollar = includes('_', '$')

const unaryPrefix = soft(includes('!', '^', '+', '-'))
const increOperator = soft(inclusive(2, '++', '--'))
const mulOperator = soft(includes('*', '/', '%').or(string('**')))
const addOperator = soft(includes('+', '-'))
const shiftOperator = soft(inclusive(2, '<<', '>>'))
const eqOperator = soft(inclusive(2, '==', '!='))
const relOperator = soft(includes('<', '>').or(inclusive(2, '<=', '>=')))
const assignOperator = soft(character('=')
  .or(inclusive(2, '&=', '|=', '^=', '+=', '-=', '*=', '/=', '%='))
  .or(inclusive(3, '<<=', '>>=', '**=')))
// 

const operator = s => soft(string(s))

const unaryExprRef = () => unaryExpr
const andExprRef = () => andExpr
const orExprRef = () => orExpr
const assignExprRef = () => assignExpr
const exprRef = () => expr

const identifierHead = underlineOrDollar.or(letter)
const identifierBody = digits.or(letters).or(underlineOrDollar).asterisk()
const identifier = identifierHead.follow(identifierBody).map(xs => xs[0] + xs[1])
// .log('name: ')

const number = digits.log('number: ')

const isQuotes = x => x == '\'' || x == '"'
const quotes = token(isQuotes)
const text = quotes.move(token(x => !isQuotes(x)).asterisk()).skip(quotes).log('text: ')

const primaryExpr = identifier.or(number).or(text)
const memberExprTail = operator('.').move(identifier)
  .or(operator('[').move(exprRef).skip(operator(']')))

// .log('# memberExprTail: ')

// operator('[').move(() => expr).skip(operator(']'))

// operator('.').move(identifier)
// .or(operator('[').move(exprRef).skip(operator(']')))
// .some()

const memberExpr = primaryExpr.extend(memberExprTail/*.log('member: ')*/)

const unaryExpr = unaryPrefix.follow(unaryExprRef)
  .or(increOperator.follow(memberExpr))
  .or(memberExpr.extend(increOperator.log('tail: ')))

const mulExpr = unaryExpr.extend(mulOperator.follow(unaryExpr).some()/*.log('mul: ')*/)
const addExpr = mulExpr.extend(addOperator.follow(mulExpr).some()/*.log('add: ')*/)
const shiftExpr = addExpr.extend(shiftOperator.follow(addExpr).some()/*.log('shift: ')*/)


const relExpr = shiftExpr.extend(relOperator.follow(shiftExpr).some().log('rel: '))
const eqExpr = relExpr.extend(eqOperator.follow(relExpr).some().log('eq: '))

const bitAndExpr = eqExpr.extend(operator('&').follow(eqExpr).some().log('bitAnd: '))
const bitXorExpr = bitAndExpr.extend(operator('^').follow(bitAndExpr).some().log('bitXor: '))
const bitOrExpr = bitXorExpr.extend(operator('|').follow(bitXorExpr).some().log('bitOr: '))

const andExpr = bitOrExpr.extend(operator('&&').follow(andExprRef).log('and: '))
const orExpr = andExpr.extend(operator('||').follow(orExprRef).log('or: '))

const condExpr = orExpr.extend(operator('?')
  .move(assignExprRef)
  .skip(operator(':'))
  .follow(assignExprRef)
  .log('cond: '))

const assignExpr = condExpr.extend(assignOperator.follow(assignExprRef).log('assign: '))

const expr = assignExpr.extend(operator(',').move(assignExpr).some()/*.log('expr: ')*/)


const clockUp = function (runnable) {
  const start = Date.now()
  console.log('time: %dms', (runnable(), Date.now() - start))
}

const s = state('a + b, c >> d, x.y, x[y]')
// clockUp(() => (x => x && console.log(x[0]))(addExpr.parse(s)))

console.log(unaryExpr.parse(state('x.v + y')))




