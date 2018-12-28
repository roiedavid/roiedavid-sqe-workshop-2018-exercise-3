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
            nodesString = 'op' + opIndex++ + '=>operation: ' + nodesString;
        nodesString += getNodeString(body[i]);
    }
    return nodesString;
}

const getStringHandlersMap = {'IfStatement': getIfStatementString, 'BlockStatement': getBlockStatementString,
    'ExpressionStatement': getExpressionStatementString ,'AssignmentExpression': getAssignmentExpressionString,
    'VariableDeclaration': getVariableDeclarationString, 'ReturnStatement': getReturnStatementString};

function getNodeString(node) {
    let func = getStringHandlersMap[node.type];
    return func ? func(node) : '';
}

function getIfStatementString(ifStatement) {
    let indexOrEmpty = '', nodesString;
    if(condIndex !==1)
        indexOrEmpty = condIndex++;
    else
        condIndex++;
    nodesString = 'cond' + indexOrEmpty +'=>condition: ' + astToCode(ifStatement.test) + '\n';
    nodesString += getIfConsequentString(ifStatement.consequent);
    nodesString += getNodeString(ifStatement.alternate);
    return nodesString;
}

function getIfConsequentString(node) {
    if(node.type === 'BlockStatement'){
        node = node.body[0];
    }
    let indexOrEmpty = '', nodesString;
    if(paraIndex !==1)
        indexOrEmpty = paraIndex++;
    else
        paraIndex++;
    nodesString= 'para' + indexOrEmpty +'=>parallel: ' + astToCode(node).replace(/;/g, '') + '\n';
    return nodesString;
}

function getBlockStatementString(node) {
    let nodesString = 'op' + opIndex++ + '=>operation: ';
    for (let i = 0 ; i < node.body.length; i++)
        nodesString += getNodeString(node.body[i]);
    return nodesString;
}

function getExpressionStatementString(node) {
    return getNodeString(node.expression);
}

function getAssignmentExpressionString(node){
    return astToCode(node).replace(/;/g, '') + '\n';
}

function getVariableDeclarationString(node) {
    return astToCode(node).replace(/let |;/g, '') + '\n';
}

function getReturnStatementString(node){
    let index = opIndex++;
    returnOpIndex = index;
    return 'op' + index + '=>operation: ' + astToCode(node).replace(/;/g, '') + '\n';
}

function getFunctionDecl(parsedCode) {
    for (let i = 0 ; i < parsedCode.body.length; i++)
        if(parsedCode.body[i].type === 'FunctionDeclaration')
            return parsedCode.body[i];
}

function getFunctionEdgesString(parsedCode) {
    initGlobalIndexes();
    let parsedFunction= getFunctionDecl(parsedCode), body = parsedFunction.body.body, edgesString = '';
    edgesString +=
        'op1->cond\n' +
        'cond(yes,right)->para\n' +
        'para(path1,bottom)->op' + returnOpIndex + '\n';

    for(let i =0; i < body.length; i++){
        if (body[i].type === 'IfStatement' || body[i].type === 'WhileStatement'){
            edgesString += getIfStatementEdgeString(body[i]);
        }
    }
    return edgesString;
}

function getIfStatementEdgeString(node) {
    let indexOrEmpty = '', edgesString = '';
    if(condIndex !==1)
        indexOrEmpty = condIndex++;
    else
        condIndex++;
    edgesString += 'cond'+ indexOrEmpty + '(no)->cond' + condIndex + '\n';
    return edgesString;
}

function initGlobalIndexes() {
    opIndex = condIndex = paraIndex = 1;
}

export {parseCode, getFunctionNodesString, getFunctionEdgesString};