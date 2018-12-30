import * as esprima from 'esprima';
import * as escodegen from 'escodegen';
import * as estraverse from 'estraverse';

let opIndex, condIndex, paraIndex, connIndex, newOP, lines;

// parseCode : string -> ast
const parseCode = (codeToParse) => {
    return esprima.parseScript(codeToParse);
};

// astToCode : ast -> string
const astToCode = (ast) => {
    return escodegen.generate(ast);
};

function getParams(parsedFunction) {
    let params = [];
    for (let i = 0 ; i < parsedFunction.params.length; i++)
        params.push(astToCode(parsedFunction.params[i])); // params is array of the function's params names
    return params;
}

function getArgsValues(parsedArgs) {
    let expression = parsedArgs.body[0].expression;
    if (expression.type === 'SequenceExpression') // case for more than one arguments
        return expression.expressions.map(exp => eval(astToCode(exp)));
    return [eval(astToCode(expression))]; // only one argument
}

function generateBindings(params, args) {
    let bindings = {};
    for (let i = 0 ; i < params.length; i++)
        bindings[params[i]] = args[i];
    return bindings;
}

// Nodes Building
function getFunctionNodesString(parsedCode, parsedArgs) {
    initGlobalIndexes();
    let bindings = generateBindings(getParams(parsedCode.body[0]), getArgsValues(parsedArgs));
    let body = parsedCode.body[0].body.body, nodesString = '', firstCond = true;
    for(let  i = 0; i < body.length; i++){
        if ((body[i].type === 'IfStatement' || body[i].type === 'WhileStatement') && firstCond){
            nodesString = `op${opIndex++}=>operation: ${nodesString}|inPath\n`;
            firstCond = false;
        }
        nodesString += getNodeString(body[i], bindings, true);
    }
    lines = nodesString.split('\n');
    return nodesString;
}

const getStringHandlersMap = {'IfStatement': getIfStatementNodeString, 'WhileStatement': getWhileStatementNodeString,
    'BlockStatement': getBlockStatementNodeString, 'ExpressionStatement': getExpressionStatementNodeString,
    'AssignmentExpression': getAssignmentExpressionNodeString, 'VariableDeclaration': getVariableDeclarationNodeString,
    'ReturnStatement': getReturnStatementNodeString};

function getNodeString(node, bindings, inPath) {
    let func = getStringHandlersMap[node.type];
    return func ? func(node, bindings, inPath) : '';
}

function getIfStatementNodeString(ifStatement, bindings, inPath) {
    newOP = true;
    let nodesString = `cond${condIndex++}=>condition: ${astToCode(ifStatement.test)}\n`;
    if(inPath)
        nodesString += '|inPath\n';
    let testRes = evalTest(ifStatement.test, bindings);
    nodesString += `para${paraIndex++}=>parallel: ${getBlockContent(ifStatement.consequent)}${testRes ? '|inPath\n' : ''}`;
    nodesString += `conn${connIndex++}=>start: empty|${inPath ? 'in' : 'out'}Connection\n`;
    nodesString += ifStatement.alternate ? getNodeString(ifStatement.alternate, deepCopy(bindings), !testRes) : '';
    return nodesString;
}

function evalTest(test, bindings) {
    let newTest = deepCopy(test);
    newTest = replaceTestVariablesByValues(newTest, bindings);
    return eval(astToCode(newTest));
}

function replaceTestVariablesByValues(test, bindings){
    return estraverse.replace(test, {
        enter: function (node) {
            if (node.type === 'Identifier'){
                let value = bindings[astToCode(node)];
                try {
                    value = eval(value);
                }
                catch (error) {
                    value = eval(astToCode(getValueAsLiterals(value, bindings)).replace(/;/g, ''));
                }
                return parseCode(value.toString()).body[0].expression;
            }
        }
    });
}

function getValueAsLiterals(value, bindings) {
    let ast = parseCode(value).body[0];
    estraverse.replace(ast, {
        enter: function (node) {
            if (node.type === 'Identifier')
                return parseCode(bindings[node.name].toString()).body[0];
        }
    });
    return ast;
}

function getBlockContent(node) {
    if(node.type === 'BlockStatement'){
        let content = '';
        for (let i = 0 ; i < node.body.length; i++)
            content += astToCode(node.body[i]).replace(/;/g,'') + '\n';
        return content;
    }
    return astToCode(node).replace(/;/g,'') + '\n';
}

function getWhileStatementNodeString(whileStatement, bindings, inPath) {
    newOP = true;
    let nodesString = `op${opIndex++}=>operation: NULL\n`;
    nodesString += `cond${condIndex++}=>condition: ${astToCode(whileStatement.test)}\n`;
    nodesString += `para${paraIndex++}=>parallel: ${getBlockContent(whileStatement.body, bindings, inPath)}`;
    return nodesString;
}

function getBlockStatementNodeString(blockStatement, bindings, inPath) {
    let nodesString = '';
    for (let i = 0 ; i < blockStatement.body.length; i++)
        nodesString += getNodeString(blockStatement.body[i], bindings, inPath);
    newOP = true;
    return nodesString;
}

function getExpressionStatementNodeString(expressionStatement, bindings, inPath) {
    return getNodeString(expressionStatement.expression, bindings, inPath);
}

function getAssignmentExpressionNodeString(assignmentExpression, bindings, inPath){
    if(inPath)
        bindings[assignmentExpression.left.name] = astToCode(assignmentExpression.right).replace(/;/g,'');
    let content = astToCode(assignmentExpression).replace(/;/g, '') + '\n';
    if(newOP)
        content = `op${opIndex++}=>operation: ` + content;
    newOP = false;
    return content;
}

function getVariableDeclarationNodeString(variableDeclaration, bindings) {
    for (let i = 0; i< variableDeclaration.declarations.length; i++)
        bindings[variableDeclaration.declarations[i].id.name] = astToCode(variableDeclaration.declarations[i].init).replace(/;/g,'');
    return astToCode(variableDeclaration).replace(/let |;/g, '') + '\n';
}

function getReturnStatementNodeString(returnStatement){
    return `op${opIndex++}=>operation: ${astToCode(returnStatement).replace(/;/g, '')}|inPath\n`;
}

// Edges Building
function getFunctionEdgesString(parsedCode) {
    initGlobalIndexes();
    let body = parsedCode.body[0].body.body, edgesString = '';
    for(let i =0; i < body.length; i++){
        if (body[i].type === 'IfStatement')
            edgesString += getIfStatementEdgeString(body[i]);
        if (body[i].type === 'WhileStatement')
            edgesString += getWhileStatementEdgeString();
    }
    return edgesString;
}

function getIfStatementEdgeString(ifStatement, skip) {
    let index = condIndex++, edgesString = '';
    if (!skip && !prevIsCond(index))
        edgesString = `op${opIndex++}->cond${index}\n`;
    edgesString += `cond${index}(yes,right)->para${index}\n`;
    edgesString += `para${index}(path1)->conn${connIndex}\n`;
    edgesString += getIfAlternateEdgeString(ifStatement, index);
    if (ifStatement.alternate && ifStatement.alternate.type === 'IfStatement')
        edgesString += getIfStatementEdgeString(ifStatement.alternate, true);
    connIndex++;
    return edgesString;
}

function getIfAlternateEdgeString(ifStatement, index) {
    let edgesString = '';
    if(ifStatement.alternate){ // there is else
        if(ifStatement.alternate.type === 'IfStatement') // it's else-if
            edgesString += `cond${index}(no)->cond${index + 1}\n`;
        else { // regular else (not else-if)
            edgesString += `cond${index}(no)->op${opIndex}\n`;
            edgesString += `op${opIndex}->conn${connIndex}\n`;
            if(nextIsCond(index))
                edgesString += `conn${connIndex}->cond${index + 1}\n`;
            else
                edgesString += `conn${connIndex}->op${opIndex + 1}\n`;
        }
    }
    else { // there is no else
        edgesString += `cond${index}(no)->conn${connIndex}\n`;
        if(nextIsCond(index))
            edgesString += `conn${connIndex}->cond${index + 1}\n`;
        else
            edgesString += `conn${connIndex}->op${opIndex}\n`;
    }
    return edgesString;
}

function prevIsCond(ifIndex) {
    for(let i = 0; i < lines.length; i++)
        if(lines[i].includes(`cond${ifIndex}`))
            for(let j = i-1; j > 0; j--) {
                if (lines[j].includes('cond'))
                    return true;
                else if (lines[j].includes('op'))
                    return false;
            }
    return false;
}

function nextIsCond(ifIndex) {
    for(let i = 0; i < lines.length; i++)
        if(lines[i].includes(`cond${ifIndex}`) && i + 3 < lines.length && lines[i + 3].includes('cond'))
            return true;
    return false;
}

function getWhileStatementEdgeString() {
    let index = condIndex++;
    let edgesString = `op${opIndex++}->op${opIndex}\n` +
        `op${opIndex}->cond${index}\n` +
        `cond${index}(yes,right)->para${index}\n` +
        `para${index}(path3)->op${opIndex}\n` +
        `cond${index}(no)->op${opIndex + 1}`;
    return edgesString;
}

function initGlobalIndexes() {
    opIndex = condIndex = paraIndex = connIndex = 1;
    newOP = true;
}

function deepCopy(element) {
    return JSON.parse(JSON.stringify(element));
}

export {parseCode, getFunctionNodesString, getFunctionEdgesString};