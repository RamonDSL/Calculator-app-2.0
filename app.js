const screenCal = document.querySelector('.screen>p')
const buttons = document.querySelectorAll('[data-key-value]')

let newCalc;

const getExpression = () => screenCal.innerHTML

const clearScreen = () => {
    screenCal.innerHTML = ""
}

const delLastValue = () => {
    const expression = getExpression()
    screenCal.innerHTML = expression.slice(0, -1)
}

const insertKeyInScreen = event => {
    if (newCalc) {
        screenCal.innerHTML = ""
        newCalc = false
    }

    let keyPressed = event.target.dataset.keyValue
    const expression = getExpression()

    let erro = false
    
    const testKeyValue = (...keys) => keys.some(signal => signal === keyPressed)
    const testKeyList = (...keys) => keys.some(signal => signal === expression[expression.length - 1])
    
    const firstValueToInsert = () => {
        if (expression.length === 0 && testKeyValue("^", "*", "/","+")) {
            erro = true
        }
    }
    const insertSignal = () => {
        if (expression.length !== 0) {
            const lastCharIsSignal = isNaN(expression[expression.length-1]) && 
                                     !testKeyValue(".", "(") && 
                                     !testKeyList(")")
            const specialCase = expression[expression.length-1] === "(" && testKeyValue("-")
            const negateNumber = testKeyValue("-") &&
                                 testKeyList("*","^","/")
            
            if (lastCharIsSignal && !specialCase && !negateNumber) {
                erro = true
            }                
        }
    }
    const insertDot = () => {
        const lastDot = expression.lastIndexOf(".")
        const lastSignal = ["*", "/","+","-","^","(",")"].some(signal => expression.lastIndexOf(signal) > lastDot)
        const Char = testKeyValue(".")

        if (lastDot != -1) {
            if (!lastSignal && Char) {
                erro = true
            }            
        }
    }
    const handleParenthesis = () => {
        const verifyIfRequireAround = () => {
            const lastOP = expression.lastIndexOf("(")
            const lastCP = expression.lastIndexOf(")")

            const lastChar = () => testKeyList("*", "/","+","-","^")

            if (lastOP === -1 && lastCP === -1) {
                return
            } else if (lastOP !== -1 && lastCP === -1) {
                
                const partOfExpression = expression.substring(lastOP)
                const haveAnyNumAfter = /\d/.test(partOfExpression)
                const lastCharIsASignal = lastChar()

                return haveAnyNumAfter && !lastCharIsASignal? true: false
            } else {

                const partOfExpression = expression.substring(lastOP)

                const haveAnyNumAfter = /\d/.test(partOfExpression)
                const haveAnySignalAfterClosedParen = /\).*[+^/*-]/.test(partOfExpression)
                const thereAreOparenThanCparen = expression.match(/\(/g).length > expression.match(/\)/g).length
                const lastCharIsASignal = lastChar()

                return haveAnyNumAfter && 
                    !haveAnySignalAfterClosedParen && 
                    thereAreOparenThanCparen &&
                    !lastCharIsASignal? true: false
            }
        }

        if (testKeyValue("(")) {
            let turnOverBehind = verifyIfRequireAround()
    
            if (turnOverBehind) {
                keyPressed = ")"
            }            
        }
    }

    if (isNaN(keyPressed)) {
        firstValueToInsert()
        insertSignal()
        insertDot()
        handleParenthesis()
    }

    if (!erro) {
        screenCal.innerHTML += keyPressed        
    }
}

const calcular = () => {
    newCalc = true
    let expression = getExpression()
    
    const formatNum = num => num < 0? num: `+${num}`

    const makeSubExpression = () => {
        
        const regExps = ({
            "getParenteseRegExp": new RegExp(/(?:\((?:(?:\d+)?(?:\.\d+)?[+\*\/-]?(?:\d+)?(?:\.\d+)?)+\)||\d*)*\((?:(?:\d+)?(?:\.\d+)?[+\*\/-]?(?:\d+)?(?:\.\d+)?)+\)(?:\((?:(?:\d+)?(?:\.\d+)?[+\*\/-]?(?:\d+)?(?:\.\d+)?)+\)||\d*)*/g),
            "catchOcultOpcOfOP": new RegExp(/\d?\(/g),
            "catchOcultOpcOfCP": new RegExp(/\)\d?/g)   

        })
        let result, partOfExpression;    

        while ((partOfExpression = regExps["getParenteseRegExp"].exec(expression)) !== null) {
            console.log(partOfExpression);
            result = catchOpc(partOfExpression[0])
            const temParenColado = result.includes(")(")
            
            if (temParenColado) {
                result = catchOpc(result.replaceAll(/\)\(/g, "*"))                
            }

            do {
                t1 = regExps["catchOcultOpcOfOP"].exec(result)
                t2 = regExps["catchOcultOpcOfCP"].exec(result)

                if (t1 !== null && t1[0] !== "(") {
                    result = result.replace("(", "*")
                } else {
                    result = result.replace("(", "")
                }
                                
                if (t2 !== null && t2[0] !== ")") {
                    result = result.replace(")", "*")
                } else {
                    result = result.replace(")", "")
                }
                

                if (t1 || t2) {
                    result = catchOpc(result)
                }
                
                regExps["catchOcultOpcOfOP"].lastIndex = 0
                regExps["catchOcultOpcOfCP"].lastIndex = 0
            } while (t1 !== null && t2 !== null);
            
            regExps["getParenteseRegExp"].lastIndex = 0
            expression = expression.replace(partOfExpression[0], result)            
        }
    }

    const makeExpression = () => {  
        expression = catchOpc(expression)   
    }

    const makeOpc = (val1, val2, opc) => {
        
        const operations = ({
            potenciacao: (num1, num2) => num1 ** num2,
            multiplicacao: (num1, num2) => num1 * num2,
            divisao: (num1, num2) => num1 / num2,
            adicaoEsubtracao: (num1, num2) => num1 + num2,
        })
        
        const nameOfOpcs = ({
            0:"potenciacao",
            1:"multiplicacao",
            2:"divisao",
            3:"adicaoEsubtracao",
        })
        
        return operations[nameOfOpcs[opc]](Number(val1), Number(val2))
    }

    const catchOpc = expres => {
        let operation, result, lookForOpcToMake;

        const typeOfOpc = ({
            getPotenciacao: new RegExp(/(-?(?:\d+)?(?:\.\d+)?)\^(-?(?:\d+)?(?:\.\d+)?)/g),
            getMultiplicacaoEDivisao: new RegExp(/(-?(?:\d+)?(?:\.\d+)?)[\*\/](-?(?:\d+)?(?:\.\d+)?)/g),
            getSomaESubtracao: new RegExp(/([+-]?(?:\d+\.\d+|\d+|\.\d+))([+-](?:\d+\.\d+|\d+|\.\d+))/g),
        })

        for (const type in typeOfOpc) {
            while ((operation = typeOfOpc[type].exec(expres)) !== null) {
                if (isNaN(operation[0][0])) {
                    lookForOpcToMake = operation[0].substring(1)
                } else {
                    lookForOpcToMake = operation[0]
                }
                console.log(operation, type, "- 2");
                switch (lookForOpcToMake[lookForOpcToMake.search(/[\*\/\^]/)]) {
                    case "^":
                        result = makeOpc(operation[1], operation[2], 0)
                        break;

                    case "*":
                        result = makeOpc(operation[1], operation[2], 1)
                        break;

                    case "/":
                        result = makeOpc(operation[1], operation[2], 2)
                        break;

                    default:
                        result = makeOpc(operation[1], operation[2], 3)
                        break;
                }                

                if (!Number.isInteger(result)) {
                    result = Number(result).toFixed(2)
                }
                
                typeOfOpc[type].lastIndex = 0
                expres = expres.replace(operation[0], formatNum(result))
            }
        }

        return expres
    }

    makeSubExpression()
    makeExpression()
    screenCal.innerHTML = expression 
}

for (const button of buttons) {
    switch (button.dataset.keyValue) {
        case "AC":
            button.addEventListener("click", clearScreen)
            break;

        case "DEL":
            button.addEventListener("click", delLastValue)
            break;

        case "=":
            button.addEventListener("click", calcular)
            break;
    
        default:
            button.addEventListener("click", insertKeyInScreen)
            break;
    }
}
