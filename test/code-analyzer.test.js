import assert from 'assert';
import {} from '../src/js/code-analyzer';
import {parseCode, getFunctionNodesString, getFunctionEdgesString} from '../src/js/code-analyzer';

describe('The javascript parser', () => {
    it('simple if nodes test', () => {
        let parsedCode = parseCode('function foo(x, y, z){\n' +
            '   let a = x + 1;   \n' +
            '   if(a < z) {\n' +
            '       c = a;\n' +
            '   }   \n' +
            '   return c;\n' +
            '}');
        let parsedArgs = parseCode('1,2,3');
        let expected = 'op1=>operation: a = x + 1\n' +
            '|inPath\n' +
            'cond1=>condition: a < z|inPath\n' +
            'para1=>parallel: c = a\n' +
            '|inPath\n' +
            'conn1=>start: empty|inConnection\n' +
            'op2=>operation: return c|inPath\n';
        assert(getFunctionNodesString(parsedCode,parsedArgs) === expected);
    });

    it('simple if edge test', () => {
        let parsedCode = parseCode('function foo(x, y, z){\n' +
            '   let a = x + 1;   \n' +
            '   if(a < z) {\n' +
            '       c = a;\n' +
            '   }   \n' +
            '   return c;\n' +
            '}');
        let expected = 'op1->cond1\n' +
            'cond1(yes,right)->para1\n' +
            'para1(path1)->conn1\n' +
            'cond1(no)->conn1\n' +
            'conn1->op2\n';
        assert(getFunctionEdgesString(parsedCode) === expected);
    });

    it('if without pre let nodes test', () => {
        let parsedCode = parseCode('function foo(x, y, z){\n' +
            '   if(x < z) {\n' +
            '       x = y;\n' +
            '   }   \n' +
            '   return x;\n' +
            '}');
        let parsedArgs = parseCode('1,2,3');
        let expected = 'op1=>operation: |inPath\n' +
            'cond1=>condition: x < z|inPath\n' +
            'para1=>parallel: x = y\n' +
            '|inPath\n' +
            'conn1=>start: empty|inConnection\n' +
            'op2=>operation: return x|inPath\n';
        assert(getFunctionNodesString(parsedCode,parsedArgs) === expected);
    });

    it('if without pre let edges test', () => {
        let parsedCode = parseCode('function foo(x, y, z){\n' +
            '   if(x < z) {\n' +
            '      x = y;\n' +
            '   }\n' +
            '   return x;\n' +
            '}');
        let expected = 'op1->cond1\n' +
            'cond1(yes,right)->para1\n' +
            'para1(path1)->conn1\n' +
            'cond1(no)->conn1\n' +
            'conn1->op2\n';
        assert(getFunctionEdgesString(parsedCode) === expected);
    });

    it('if with several inners', () => {
        let parsedCode = parseCode('function foo(x, y, z){\n' +
            '    let a = x + 1;\n' +
            '    let c = 0;\n' +
            '    if (c < z) {\n' +
            '        c = c + 5;\n' +
            '        a = 7;\n' +
            '    }\n' +
            '    return c;\n' +
            '}');
        let parsedArgs = parseCode('1,2,3');
        let expected = 'op1=>operation: a = x + 1\n' +
            'c = 0\n' +
            '|inPath\n' +
            'cond1=>condition: c < z|inPath\n' +
            'para1=>parallel: c = c + 5\n' +
            'a = 7\n' +
            '|inPath\n' +
            'conn1=>start: empty|inConnection\n' +
            'op2=>operation: return c|inPath\n';
        assert(getFunctionNodesString(parsedCode,parsedArgs) === expected);
    });

    it('if with no block (one statement in then)', () => {
        let parsedCode = parseCode('function foo(x, y, z){\n' +
            '    let a = x + 1;\n' +
            '    if (x < z)\n' +
            '        a = 7;\n' +
            '    return x;\n' +
            '}');
        let parsedArgs = parseCode('1,2,3');
        let expected = 'op1=>operation: a = x + 1\n' +
            '|inPath\n' +
            'cond1=>condition: x < z|inPath\n' +
            'para1=>parallel: a = 7\n' +
            '|inPath\n' +
            'conn1=>start: empty|inConnection\n' +
            'op2=>operation: return x|inPath\n';
        assert(getFunctionNodesString(parsedCode,parsedArgs) === expected);
    });


    it('if and else-if test', () => {
        let parsedCode = parseCode('function foo(x, y, z){\n' +
            '    let a = x + 1;\n' +
            '    let b = a + y;\n' +
            '    let c = 0;\n' +
            '    \n' +
            '    if (b < z) \n' +
            '        c = c + 5;\n' +
            '    else if (b < z * 2) \n' +
            '        c = c + x + 5;\n' +
            '    return c;\n' +
            '}');
        let parsedArgs = parseCode('1,2,3');
        let expected = 'op1=>operation: a = x + 1\n' +
            'b = a + y\n' +
            'c = 0\n' +
            '|inPath\n' +
            'cond1=>condition: b < z|inPath\n' +
            'para1=>parallel: c = c + 5\n' +
            'conn1=>start: empty|inConnection\n' +
            'cond2=>condition: b < z * 2|inPath\n' +
            'para2=>parallel: c = c + x + 5\n' +
            '|inPath\n' +
            'conn2=>start: empty|inConnection\n' +
            'op2=>operation: return c|inPath\n';
        assert(getFunctionNodesString(parsedCode,parsedArgs) === expected);
    });

    it('simple while test', () => {
        let parsedCode = parseCode('function foo(x, y, z){\n' +
            '    let a = x + 1;\n' +
            '    while (x < z)\n' +
            '        a ++;\n' +
            '    return x;\n' +
            '}');
        let parsedArgs = parseCode('1,2,3');
        let expected = 'op1=>operation: a = x + 1\n' +
            '|inPath\n' +
            'op2=>operation: NULL|inPath\n' +
            'cond1=>condition: x < z|inPath\n' +
            'para1=>parallel: a++\n' +
            '|inPath\n' +
            'op3=>operation: return x|inPath\n';
        assert(getFunctionNodesString(parsedCode,parsedArgs) === expected);
    });


    it('two it statements with one arg', () => {
        let parsedCode = parseCode('function foo(x){\n' +
            '   if (x > 1)\n' +
            '      x = 7;\n' +
            '   if (x < 2)\n' +
            '      x = 8;\n' +
            '   return x;\n' +
            '}');
        let parsedArgs = parseCode('1');
        let expected = 'op1=>operation: |inPath\n' +
            'cond1=>condition: x > 1|inPath\n' +
            'para1=>parallel: x = 7\n' +
            'conn1=>start: empty|inConnection\n' +
            '|inPath\n' +
            'cond2=>condition: x < 2|inPath\n' +
            'para2=>parallel: x = 8\n' +
            '|inPath\n' +
            'conn2=>start: empty|inConnection\n' +
            'op2=>operation: return x|inPath\n';
        assert(getFunctionNodesString(parsedCode,parsedArgs) === expected);
    });

    it('two it statements with one arg (egdes)', () => {
        let parsedCode = parseCode('function foo(x){\n' +
            '   if (x > 1)\n' +
            '      x = 7;\n' +
            '   if (x < 2)\n' +
            '      x = 8;\n' +
            '   return x;\n' +
            '}');
        let expected = 'op1->cond1\n' +
            'cond1(yes,right)->para1\n' +
            'para1(path1)->conn1\n' +
            'cond1(no)->conn1\n' +
            'conn1->cond2\n' +
            'cond2(yes,right)->para2\n' +
            'para2(path1)->conn2\n' +
            'cond2(no)->conn2\n' +
            'conn2->op2\n';
        assert(getFunctionEdgesString(parsedCode) === expected);
    });

    it('while edges', () => {
        let parsedCode = parseCode('function foo(x){\n' +
            '   while (x < 10){\n' +
            '       x++;\n' +
            '   }\n' +
            '   return x;\n' +
            '}');
        let expected = 'op1->op2\n' +
            'op2->cond1\n' +
            'cond1(yes,right)->para1\n' +
            'para1(path3)->op2\n' +
            'cond1(no)->op3\n';
        assert(getFunctionEdgesString(parsedCode) === expected);
    });

    it('two while edges', () => {
        let parsedCode = parseCode('function foo(x){\n' +
            'while (x < 10){\n' +
            '       x++;\n' +
            '   }   \n' +
            '\n' +
            'while (x < 10){\n' +
            '       x++;\n' +
            '   }\n' +
            '   return x;\n' +
            '}');
        let expected = 'op1->op2\n' +
            'op2->cond1\n' +
            'cond1(yes,right)->para1\n' +
            'para1(path3)->op2\n' +
            'cond1(no)->op3\n' +
            'op2->op2\n' +
            'op2->cond2\n' +
            'cond2(yes,right)->para2\n' +
            'para2(path3)->op2\n' +
            'cond2(no)->op3\n';
        assert(getFunctionEdgesString(parsedCode) === expected);
    });

    it('one if edges', () => {
        let parsedCode = parseCode('function foo(x){\n' +
            '   if (x < 4)\n' +
            '      x = 6;\n' +
            '   else if (x > 7)\n' +
            '       x = 8;\n' +
            '   return x;\n' +
            '}');
        let expected = 'op1->cond1\n' +
            'cond1(yes,right)->para1\n' +
            'para1(path1)->conn1\n' +
            'cond1(no)->cond2\n' +
            'cond2(yes,right)->para2\n' +
            'para2(path1)->conn1\n' +
            'cond2(no)->conn1\n' +
            'conn1->op2\n';
        assert(getFunctionEdgesString(parsedCode) === expected);
    });

    it('block node', () => {
        let parsedCode = parseCode('function foo(x){\n' +
            '   {\n' +
            '   let y = 8;\n' +
            '   y = 9;\n' +
            '   }\n' +
            '   return x;\n' +
            '}');
        let parsedArgs = parseCode('1');
        let expected = 'y = 8\n' +
            'y = 9\n' +
            'op1=>operation: return x|inPath\n';
        assert(getFunctionNodesString(parsedCode, parsedArgs) === expected);
    });

    it('mul let node', () => {
        let parsedCode = parseCode('function foo(x){\n' +
            '  let y = 8;   \n' +
            '  if(x < 4)\n' +
            '     y = 9;\n' +
            '  let z = 8;\n' +
            '  z = y;\n' +
            '  if(x < 6) \n' +
            '     z = 9;\n' +
            '   return x;\n' +
            '}');
        let parsedArgs = parseCode('1');
        let expected = 'op1=>operation: y = 8\n' +
            '|inPath\n' +
            'cond1=>condition: x < 4|inPath\n' +
            'para1=>parallel: y = 9\n' +
            '|inPath\n' +
            'conn1=>start: empty|inConnection\n' +
            'op2=>operation: z = 8\n' +
            'z = y\n' +
            '|inPath\n' +
            'cond2=>condition: x < 6|inPath\n' +
            'para2=>parallel: z = 9\n' +
            '|inPath\n' +
            'conn2=>start: empty|inConnection\n' +
            'op3=>operation: return x|inPath\n';
        assert(getFunctionNodesString(parsedCode, parsedArgs) === expected);
    });

    it('let in if node', () => {
        let parsedCode = parseCode('function foo(x){\n' +
            '  let y = 8;   \n' +
            '  if(x < 4){\n' +
            '     let yy =0;\n' +
            '     yy = 9;\n' +
            '}\n' +
            '  let z = 8;\n' +
            '  z = y;\n' +
            '  if(x < 6) \n' +
            '     z = 9;\n' +
            '   return x;\n' +
            '}');
        let parsedArgs = parseCode('1');
        let expected = 'op1=>operation: y = 8\n' +
            '|inPath\n' +
            'cond1=>condition: x < 4|inPath\n' +
            'para1=>parallel: let yy = 0\n' +
            'yy = 9\n' +
            '|inPath\n' +
            'conn1=>start: empty|inConnection\n' +
            'op2=>operation: z = 8\n' +
            'z = y\n' +
            '|inPath\n' +
            'cond2=>condition: x < 6|inPath\n' +
            'para2=>parallel: z = 9\n' +
            '|inPath\n' +
            'conn2=>start: empty|inConnection\n' +
            'op3=>operation: return x|inPath\n';
        assert(getFunctionNodesString(parsedCode, parsedArgs) === expected);
    });

    it('let in while node', () => {
        let parsedCode = parseCode('function foo(x){\n' +
            '  let y = 8;   \n' +
            '  while(x < 4){\n' +
            '     let yy =0;\n' +
            '     yy = 9;\n' +
            '}\n' +
            '  let z = 8;\n' +
            '  z = y;\n' +
            '  if(x < 6) \n' +
            '     z = 9;\n' +
            '   return x;\n' +
            '}');
        let parsedArgs = parseCode('1');
        let expected = 'op1=>operation: y = 8\n' +
            '|inPath\n' +
            'op2=>operation: NULL|inPath\n' +
            'cond1=>condition: x < 4|inPath\n' +
            'para1=>parallel: let yy = 0\n' +
            'yy = 9\n' +
            '|inPath\n' +
            'op3=>operation: z = 8\n' +
            'z = y\n' +
            '|inPath\n' +
            'cond2=>condition: x < 6|inPath\n' +
            'para2=>parallel: z = 9\n' +
            '|inPath\n' +
            'conn1=>start: empty|inConnection\n' +
            'op4=>operation: return x|inPath\n';
        assert(getFunctionNodesString(parsedCode, parsedArgs) === expected);
    });

    it('let in while edge', () => {
        let parsedCode = parseCode('function foo(x){\n' +
            '  let y = 8;   \n' +
            '  while(x < 4){\n' +
            '     let yy =0;\n' +
            '     yy = 9;\n' +
            '}\n' +
            '  let z = 8;\n' +
            '  z = y;\n' +
            '  if(x < 6) \n' +
            '     z = 9;\n' +
            '   return x;\n' +
            '}');
        let expected = 'op1->op2\n' +
            'op2->cond1\n' +
            'cond1(yes,right)->para1\n' +
            'para1(path3)->op2\n' +
            'cond1(no)->op3\n' +
            'cond2(yes,right)->para2\n' +
            'para2(path1)->conn1\n' +
            'cond2(no)->conn1\n' +
            'conn1->op2\n';
        assert(getFunctionEdgesString(parsedCode) === expected);
    });

    it('newOp assi node', () => {
        let parsedCode = parseCode('function foo(x){\n' +
            '  let y = 8;   \n' +
            '  if(x < 4){\n' +
            '     let yy =0;\n' +
            '     yy = 9;\n' +
            '}\n' +
            '  z = y;\n' +
            '  if(x < 6) \n' +
            '     z = 9;\n' +
            '   return x;\n' +
            '}');
        let parsedArgs = parseCode('1');
        let expected = 'op1=>operation: y = 8\n' +
            '|inPath\n' +
            'cond1=>condition: x < 4|inPath\n' +
            'para1=>parallel: let yy = 0\n' +
            'yy = 9\n' +
            '|inPath\n' +
            'conn1=>start: empty|inConnection\n' +
            'op2=>operation: z = y\n' +
            '|inPath\n' +
            'cond2=>condition: x < 6|inPath\n' +
            'para2=>parallel: z = 9\n' +
            '|inPath\n' +
            'conn2=>start: empty|inConnection\n' +
            'op3=>operation: return x|inPath\n';
        assert(getFunctionNodesString(parsedCode, parsedArgs) === expected);
    });

    it('if else with reg else node', () => {
        let parsedCode = parseCode('function foo(x){\n' +
            '  let y = 8;   \n' +
            '  if(x < 4){\n' +
            '     let yy =0;\n' +
            '     yy = 9;\n' +
            '}    else\n' +
            '     z = 9;\n' +
            '   return x;\n' +
            '}');
        let parsedArgs = parseCode('1');
        let expected = 'op1=>operation: y = 8\n' +
            '|inPath\n' +
            'cond1=>condition: x < 4|inPath\n' +
            'para1=>parallel: let yy = 0\n' +
            'yy = 9\n' +
            '|inPath\n' +
            'conn1=>start: empty|inConnection\n' +
            'op2=>operation: z = 9\n' +
            'op3=>operation: return x|inPath\n';
        assert(getFunctionNodesString(parsedCode, parsedArgs) === expected);
    });

    it('out of path while node', () => {
        let parsedCode = parseCode('function foo(x){\n' +
            '  while(x < 0)\n' +
            '     x = x + 1;\n' +
            '   return x;\n' +
            '}');
        let parsedArgs = parseCode('1');
        let expected = 'op1=>operation: |inPath\n' +
            'op2=>operation: NULL|inPath\n' +
            'cond1=>condition: x < 0|inPath\n' +
            'para1=>parallel: x = x + 1\n' +
            'op3=>operation: return x|inPath\n';
        assert(getFunctionNodesString(parsedCode, parsedArgs) === expected);
    });

    it('while if node', () => {
        let parsedCode = parseCode('function foo(x){\n' +
            'let c = 8;     \n' +
            'while (c < x)\n' +
            '     c = c+1;\n' +
            'if (x < 5) {\n' +
            '        x = 7;\n' +
            '    }\n' +
            '    return x;\n' +
            '}');
        let parsedArgs = parseCode('1');
        let expected = 'op1=>operation: c = 8\n' +
            '|inPath\n' +
            'op2=>operation: NULL|inPath\n' +
            'cond1=>condition: c < x|inPath\n' +
            'para1=>parallel: c = c + 1\n' +
            '|inPath\n' +
            'cond2=>condition: x < 5|inPath\n' +
            'para2=>parallel: x = 7\n' +
            '|inPath\n' +
            'conn1=>start: empty|inConnection\n' +
            'op3=>operation: return x|inPath\n';
        assert(getFunctionNodesString(parsedCode, parsedArgs) === expected);
    });


    it(' big if egde', () => {
        let parsedCode = parseCode('function foo(x, y, z){\n' +
            '    let a = x + 1;\n' +
            '    let b = a + y;\n' +
            '    let c = 0;\n' +
            '    \n' +
            '    if (b < z) {\n' +
            '        c = c + 5;\n' +
            '    } else if (b < z * 2) {\n' +
            '        c = c + x + 5;\n' +
            '    } else {\n' +
            '        c = c + z + 5;\n' +
            '    }\n' +
            '    \n' +
            '    return c;\n' +
            '}');
        let expected = 'op1->cond1\n' +
            'cond1(yes,right)->para1\n' +
            'para1(path1)->conn1\n' +
            'cond1(no)->cond2\n' +
            'cond2(yes,right)->para2\n' +
            'para2(path1)->conn1\n' +
            'cond2(no)->op2\n' +
            'op2->conn1\n' +
            'conn1->op3\n';
        assert(getFunctionEdgesString(parsedCode) === expected);
    });

});
