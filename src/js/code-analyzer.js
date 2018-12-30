import * as esprima from 'esprima';
import * as escodegen from 'escodegen';

let opIndex, condIndex, paraIndex, connIndex, newOP, lines;

// parseCode : string -> ast
const parseCode = (codeToParse) => {
    return esprima.parseScript(codeToParse);
};

// astToCode : ast -> string
const astToCode = (ast) => {
    return escodegen.generate(ast);
};

// Nodes Building
function getFunctionNodesString(parsedCode) {
    initGlobalIndexes();
    let body = parsedCode.body[0].body.body, nodesString = '', firstCond = true;
    for(let  i = 0; i < body.length; i++){
        if ((body[i].type === 'IfStatement' || body[i].type === 'WhileStatement') && firstCond){
            nodesString = `op${opIndex++}=>operation: ${nodesString}`;
            firstCond = false;
        }
        nodesString += getNodeString(body[i]);
    }
    lines = nodesString.split('\n');
    return nodesString;
}

const getStringHandlersMap = {'IfStatement': getIfStatementNodeString, 'WhileStatement': getWhileStatementNodeString,
    'BlockStatement': getBlockStatementNodeString, 'ExpressionStatement': getExpressionStatementNodeString,
    'AssignmentExpression': getAssignmentExpressionNodeString, 'VariableDeclaration': getVariableDeclarationNodeString,
    'ReturnStatement': getReturnStatementNodeString};

function getNodeString(node) {
    let func = getStringHandlersMap[node.type];
    return func ? func(node) : '';
}

function getIfStatementNodeString(ifStatement) {
    newOP = true;
    let nodesString = `cond${condIndex++}=>condition: ${astToCode(ifStatement.test)}\n`;
    nodesString += `para${paraIndex++}=>parallel: ${getBlockContent(ifStatement.consequent)}`;
    nodesString += `conn${connIndex++}=>start: i'm white|connection\n`;
    nodesString += ifStatement.alternate ? getNodeString(ifStatement.alternate) : '';
    return nodesString;
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

function getWhileStatementNodeString(whileStatement) {
    newOP = true;
    let nodesString = `op${opIndex++}=>operation: NULL\n`;
    nodesString += `cond${condIndex++}=>condition: ${astToCode(whileStatement.test)}\n`;
    nodesString += `para${paraIndex++}=>parallel: ${getBlockContent(whileStatement.body)}`;
    return nodesString;
}

function getBlockStatementNodeString(blockStatement) {
    let nodesString = '';
    for (let i = 0 ; i < blockStatement.body.length; i++)
        nodesString += getNodeString(blockStatement.body[i]);
    newOP = true;
    return nodesString;
}

function getExpressionStatementNodeString(expressionStatement) {
    return getNodeString(expressionStatement.expression);
}

function getAssignmentExpressionNodeString(assignmentExpression){
    let content = astToCode(assignmentExpression).replace(/;/g, '') + '\n';
    if(newOP)
        content = `op${opIndex++}=>operation: ` + content;
    newOP = false;
    return content;
}

function getVariableDeclarationNodeString(variableDeclaration) {
    return astToCode(variableDeclaration).replace(/let |;/g, '') + '\n';
}

function getReturnStatementNodeString(returnStatement){
    return `op${opIndex++}=>operation: ${astToCode(returnStatement).replace(/;/g, '')}\n`;
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

export {parseCode, getFunctionNodesString, getFunctionEdgesString};