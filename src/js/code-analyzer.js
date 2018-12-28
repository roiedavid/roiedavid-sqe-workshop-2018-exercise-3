import * as esprima from 'esprima';
import * as escodegen from 'escodegen';

let opIndex, condIndex, paraIndex, returnOpIndex;

// parseCode : string -> ast
const parseCode = (codeToParse) => {
    return esprima.parseScript(codeToParse ,{loc:true});
};

// astToCode : ast -> string
const astToCode = (ast) => {
    return escodegen.generate(ast);
};

function getFunctionNodesString(parsedCode) {
    initGlobalIndexes();
    let parsedFunction= getFunctionDecl(parsedCode), body = parsedFunction.body.body, nodesString = '';
    for(let  i = 0; i < body.length; i++){
        if (body[i].type === 'IfStatement' || body[i].type === 'WhileStatement')
            nodesString = `op${opIndex++}=>operation: ${nodesString}`;
        nodesString += getNodeString(body[i]);
    }
    return nodesString;
}

const getStringHandlersMap = {'IfStatement': getIfStatementNodeString, 'BlockStatement': getBlockStatementNodeString,
    'ExpressionStatement': getExpressionStatementNodeString ,'AssignmentExpression': getAssignmentExpressionNodeString,
    'VariableDeclaration': getVariableDeclarationNodeString, 'ReturnStatement': getReturnStatementNodeString};

function getNodeString(node) {
    let func = getStringHandlersMap[node.type];
    return func ? func(node) : '';
}

function getIfStatementNodeString(ifStatement) {
    let indexOrEmpty = '';
    if(condIndex !==1)
        indexOrEmpty = condIndex++;
    else
        condIndex++;
    let nodesString = `cond${indexOrEmpty}=>condition: ${astToCode(ifStatement.test)}\n`;
    nodesString += getIfConsequentString(ifStatement.consequent);
    nodesString += getNodeString(ifStatement.alternate);
    return nodesString;
}

function getIfConsequentString(node) {
    let indexOrEmpty = '';
    if(paraIndex !==1)
        indexOrEmpty = paraIndex++;
    else
        paraIndex++;
    let nodesString = `para${indexOrEmpty}=>parallel: ${astToCode(node).replace(/ {2}|{|}|;|\n/g, '')}\n`;
    return nodesString;
}

function getBlockStatementNodeString(node) {
    let nodesString = `op${opIndex++}=>operation: `;
    for (let i = 0 ; i < node.body.length; i++)
        nodesString += getNodeString(node.body[i]);
    return nodesString;
}

function getExpressionStatementNodeString(node) {
    return getNodeString(node.expression);
}

function getAssignmentExpressionNodeString(node){
    return astToCode(node).replace(/;/g, '') + '\n';
}

function getVariableDeclarationNodeString(node) {
    return astToCode(node).replace(/let |;/g, '') + '\n';
}

function getReturnStatementNodeString(node){
    let index = opIndex++;
    returnOpIndex = index;
    return `op${index}=>operation: ${astToCode(node).replace(/;/g, '')}\n`;
}

function getFunctionDecl(parsedCode) {
    for (let i = 0 ; i < parsedCode.body.length; i++)
        if(parsedCode.body[i].type === 'FunctionDeclaration')
            return parsedCode.body[i];
}

function getFunctionEdgesString(parsedCode) {
    initGlobalIndexes();
    let parsedFunction= getFunctionDecl(parsedCode), body = parsedFunction.body.body;
    let edgesString = 'op1->cond\n';
    opIndex++;
    for(let i =0; i < body.length; i++){
        if (body[i].type === 'IfStatement' || body[i].type === 'WhileStatement'){
            edgesString += getIfStatementEdgeString();
        }
    }
    return edgesString;
}

function getIfStatementEdgeString() {
    let indexOrEmpty = '';
    if(condIndex !==1)
        indexOrEmpty = condIndex++;
    else
        condIndex++;
    let edgesString = `cond${indexOrEmpty}(yes,right)->para${indexOrEmpty}\n`;
    edgesString += `para${indexOrEmpty}(path1)->op${returnOpIndex}\n`;
    edgesString += `cond${indexOrEmpty}(no)->op${opIndex}\n`;
    edgesString += `op${opIndex}->op${returnOpIndex}\n`;
    return edgesString;
}

function initGlobalIndexes() {
    opIndex = condIndex = paraIndex = 1;
}

export {parseCode, getFunctionNodesString, getFunctionEdgesString};