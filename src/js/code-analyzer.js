import * as esprima from 'esprima';
import * as escodegen from 'escodegen';

let opIndex, condIndex, paraIndex, connIndex;

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
    let parsedFunction= getFunctionDecl(parsedCode), body = parsedFunction.body.body;
    let nodesString = '';
    for(let  i = 0; i < body.length; i++){
        if (body[i].type === 'IfStatement')
            nodesString = `conn1=>start: i'm white|connection\nop${opIndex++}=>operation: ${nodesString}`;
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
    let nodesString = `cond${condIndex++}=>condition: ${astToCode(ifStatement.test)}\n`;
    nodesString += `para${paraIndex++}=>parallel: ${astToCode(ifStatement.consequent).replace(/ {2}|{|}|;|\n/g, '')}\n`;
    nodesString += ifStatement.alternate ? getNodeString(ifStatement.alternate) : '';
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
    return `op${opIndex++}=>operation: ${astToCode(node).replace(/;/g, '')}\n`;
}

function getFunctionDecl(parsedCode) {
    for (let i = 0 ; i < parsedCode.body.length; i++)
        if(parsedCode.body[i].type === 'FunctionDeclaration')
            return parsedCode.body[i];
}

function getFunctionEdgesString(parsedCode) {
    initGlobalIndexes();
    let parsedFunction= getFunctionDecl(parsedCode), body = parsedFunction.body.body;
    let edgesString = `op${opIndex++}->cond${condIndex}\n`;
    for(let i =0; i < body.length; i++){
        if (body[i].type === 'IfStatement')
            edgesString += getIfStatementEdgeString(body[i]);
    }
    return edgesString;
}

function getIfStatementEdgeString(ifStatement) {
    let index = condIndex++;
    let edgesString = `cond${index}(yes,right)->para${index}\n`;
    edgesString += `para${index}(path1)->conn${connIndex}\n`;
    edgesString += `cond${index}(no)->` +
        (ifStatement.alternate && ifStatement.alternate.type === 'IfStatement' ? `cond${index+1}` : `op${opIndex}`) + '\n';
    edgesString += `op${opIndex}->conn${connIndex}\n`;
    edgesString += `conn${connIndex}->op${opIndex+1}\n`;
    edgesString += (ifStatement.alternate && ifStatement.alternate.type === 'IfStatement') ? getIfStatementEdgeString(ifStatement.alternate) : '';
    return edgesString;
}

function initGlobalIndexes() {
    opIndex = condIndex = paraIndex = connIndex = 1;
}

export {parseCode, getFunctionNodesString, getFunctionEdgesString};