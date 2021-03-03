
/*  Author: Ryan Taylor Montgomery
 *  Date: May 27th 2019
 *  License: MIT License
 *
 *	Copyright (c) 2019 Vault Lambda LLC
 *
 *	Permission is hereby granted, free of charge, to any person obtaining a copy
 *	of this software and associated documentation files (the "Software"), to deal
 *	in the Software without restriction, including without limitation the rights
 *	to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 *	copies of the Software, and to permit persons to whom the Software is
 *	furnished to do so, subject to the following conditions:
 *
 *	The above copyright notice and this permission notice shall be included in all
 *	copies or substantial portions of the Software.
 *
 *	THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 *	IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 *	FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 *	AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 *	LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 *	OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 *	SOFTWARE.
 * 
 */
const grul = new (function () {
    /*  Function Name: this.docs
     *  Description: Retrieves api information from source
     */
    this.docs = function () {
        let grulref = this;
        let Utilities = Object.keys(this);
        let source = this.constructor.toString();
        const regex = /\/\*?(?:\t|\ |\r|\n)*?Function\ Name:(?:.|\r|\n)*?this\.([a-zA-Z0-9]*)(?:.|\r|\n)*?Description:((?:.|\r|\n)*?)\*\//gmi;
        let m;
        let funcDetail = {};
        while ((m = regex.exec(source)) !== null) {
            // This is necessary to avoid infinite loops with zero-width matches
            if (m.index === regex.lastIndex) {
                regex.lastIndex++;
            }

            // The result can be accessed through the `m`-variable.
            funcDetail[m[1]] = {
                "description": m[2]
            };
        }
        let docs = Utilities.map(function (key) {
            return {
                name: key,
                args: grulref.funcArgs(grul[key]),
                details: (key in funcDetail ? funcDetail[key] : { "description": "No description provided" })
            };
        });
        return docs;
    };
    /*  Function Name: this.clone
     *  Description: Clones data (breaking attachment to existing datasets)
     */
    this.clone = function (obj) {
        return JSON.parse(JSON.stringify(obj));
    };
    /*  Function Name: this.funcArgs
     *  Description: Retrieves functions arguments given a function definition
     */
    this.funcArgs = function (func) {
        return (func + "")
            .replace(/[/][/].*$/mg, "")
            .replace(/\s+/g, "")
            .replace(/[/][*][^/*]*[*][/]/g, "")
            .split("){", 1)[0].replace(/^[^(]*[(]/, "")
            .replace(/=[^,]+/g, "")
            .split(",").filter(Boolean);
    };
    /*  Function Name: this.executeLogic
     *  Description: Executes logic of lambda depending on passed structure
     */
    this.executeLogic = function (logicController, location, patternIndex, aData, historicalTypePath, historicalLiteralPath, historicalObjectPath, initial) {
        var logic = logicController;
        var continueTraversal;
        if (logic.constructor === Array) {
            if (logic[patternIndex].constructor === Object) {
                continueTraversal = location in logic[patternIndex] ? logic[patternIndex][location](aData, historicalTypePath, historicalLiteralPath, historicalObjectPath, initial) : true;
            }
            else {
                continueTraversal = logic[patternIndex](aData, historicalTypePath, historicalLiteralPath, historicalObjectPath, initial);
            }
        }
        else if (logic.constructor === Object) {
            continueTraversal = location in logic ? logic[location](aData, historicalTypePath, historicalLiteralPath, historicalObjectPath, initial) : true;
        }
        else {
            continueTraversal = logic(aData, historicalTypePath, historicalLiteralPath, historicalObjectPath, initial);
        }
        return continueTraversal;
    };
    /*  Variable Name: this.typeExtensions
     *  Description: This variable holds a traversal map
     */
    this.typeExtensions = {
        "Array":{
            type: Array,
            enumerators:()=>{
                return [];
            }
        }
    }
    /*  Function Name: this.extend
     *  Description: This function configures a type extension for the enumerator specified
     */
    this.extend = function(type,enumerator){
        this.typeExtensions[type.name] = {
            type:type,
            enumerators:(enumerator.constructor===Array?enumerator:[enumerator])
        };
    }
    //Recursive Helper Functions
    /*	Function Name: this.pluck
     *	Description: This function traverses data given a path (array of literal traversals in order)
     */
    this.pluck = function (data, path, set = null) {
        if (path.length > 1) {
            return this.pluck(data[path[0]], path.slice(1), set);
        }
        else if (path.length === 0) {
            if (set === null) {
                return data;
            }
            else {
                data = set;
                return data;
            }
        }
        else {
            if (set === null) {
                return data[path[0]];
            }
            else {
                data[path[0]] = set;
                return data[path[0]];
            }
        }
        
    };
    /* 	Function Name: this.pathExists
     *	Description: This function checks to see if given path exists in a set
     */
    this.pathExists = function (data, bindpath, curpath = []) {
        let isEqual = this.arrEquals(bindpath, curpath) && bindpath.length === curpath.length;
        if (!isEqual) {
            curpath.push(bindpath[curpath.length]);
        }
        try {
            if (this.pluck(data, curpath) !== undefined) {
                if (isEqual === true) {
                    return true;
                }
                return this.pathExists(data, bindpath, curpath);
            }
            else {
                return bindpath.slice(curpath.length - 1);
            }
        }
        catch (exception) {
            return bindpath.slice(curpath.length - 1);
        }
    };
    /*   Function Name: this.scaffold
     *   Description: This function constructs a blank incoming typed item
     */
    this.scaffold = function (input) {
        if (input.constructor === Object) {
            return {};
        }
        else if (input.constructor === Array) {
            return [];
        }
        else {
            return input;
        }
    };
    /*  Function Name: this.isPrimitive
     *  Description: This function determines whether or not the argument is a primitive type in javascript
     */
    this.isPrimitive = function (arg) {
        var type = typeof arg;
        return arg === null || (type !== "object" && type !== "function");
    };
    /*	Function Name: this.arrEquals
     *	Description: This function iterates through array elements to check equality
     */
    this.arrEquals = function (arr1, arr2) {
        if (arr1.length !== arr2.length){
            return false;
        }
        for (let i = parseInt(arr1.length); i--;) {
            if (arr1[i] !== arr2[i]){
                return false;
            }
        }
        return true;
    };
    /*  Variable Name: this.accessMap
     *  Description: This variable holds references to all objects that have been accessed via isCircular to remove __accessed__ key for later use
     */
    this.accessMap = {};
    /*  Function Name: this.clearAccessMap
     *  Description: This function clears an access map utilized by grul to halt at circular references.
     */
    this.clearAccessMap = function (){
        Object.keys(this.accessMap).forEach(key=>{
            delete this.accessMap[key].__accessed__;    //clean up temporary member on accessed object
            delete this.accessMap[key];                 //clean up temporary member on access map
        });
    };
    /*  Function Name: this.isCircular
     *  Description: This function determines given a dataset whether or not that traversed path is circular in nature
     */
    this.isCircular = function (data){
        if(this.isPrimitive(data)){
            return false;
        }
        else {
            if("__accessed__" in data && data.__accessed__){
                return true;
            }
            let accessMapKey = Object.keys(this.accessMap).length;
            this.accessMap[accessMapKey] = data;
            data.__accessed__ = true;
            return false;
        }
    };
    //Recursive Lambda's
    /*  Function Name: this.atHierarchy
     *  Description: This function traverses any static or dynamic template hierarchy executing any head, tail logic to restructure a 2 dimensional JSON set
     *              into the defined hierarchical set and grouping rows by a unique dynamically generated head key
     */
    this.atHierarchy = function (data, hierarchy, historicalTypePath = [], historicalLiteralPath = [], root = this.scaffold(hierarchy)) {
        if (hierarchy.constructor === Array) {
            hierarchy.forEach((template) => {
                let compound = {}; // defines data/hierarchy/path to be set for next 
                let heads = []; // defines head which generates hierarchical compound key
                let tails = []; // defines tails which generates hierarchical values based on previous recursive action
                let branches = []; // defined branches which reflect hierarchical child slots
                let rHierarchy = template.constructor === Function ? template(data, historicalTypePath, historicalLiteralPath, hierarchy) : template;
                let out = this.scaffold(rHierarchy); // defines scaffolding for template to be cloned into a segment instance
                //build branches
                this.atEvery(rHierarchy, (segmentInput, typePath, literalPath) => {
                    if(segmentInput === null){
                        return false;
                    }
                    
                    if (segmentInput.constructor === Array) {
                        let segmentMap = {
                            "segmentTypePath": typePath,
                            "segmentLiteralPath": literalPath,
                            "hierarchy": segmentInput
                        };
                        branches.push(segmentMap);
                        this.pluck(out, literalPath, []);
                        return false;
                    }
                    else if (segmentInput.constructor === Object && "head" in segmentInput && segmentInput.head.constructor === Function) {
                        let segmentMap = {
                            "segmentTypePath": typePath,
                            "segmentLiteralPath": literalPath,
                            "map": segmentInput.head
                        };
                        heads.push(segmentMap);
                        this.pluck(out, segmentMap.segmentLiteralPath, "");
                        return false;
                    }
                    else if (segmentInput.constructor === Object && "tail" in segmentInput && segmentInput.tail.constructor === Function) {
                        let segmentMap = {
                            "segmentTypePath": typePath,
                            "segmentLiteralPath": literalPath,
                            "map": segmentInput.tail
                        };
                        tails.push(segmentMap);
                        this.pluck(out, segmentMap.segmentLiteralPath, "");
                        return false;
                    }
                    else {
                        this.pluck(out, literalPath, this.scaffold(segmentInput));
                    }
                });
                //fill segments
                data.forEach((row) => {
                    let segment = this.clone(out);
                    let compoundKey = "";
                    //fill segment with head results
                    heads.forEach((head) => {
                        let value = head.map(row,
                            historicalTypePath.concat(head.segmentTypePath),
                            historicalLiteralPath.concat(head.segmentLiteralPath));
                        let set = this.pluck(segment, head.segmentLiteralPath, value);
                        segment = head.segmentLiteralPath.length === 0 ? set : segment;
                        compoundKey += JSON.stringify(value);
                    });
                    /* Future Recursively Enumerable Hierarchy Updates
                    this.atPattern(segment,["head"],{"head":(data,htp,hlp)=>{
                        Object.keys(this.accessMap).forEach(key=>{
                            delete this.accessMap[key].__accessed__;    //clean up temporary member on accessed object
                            delete this.accessMap[key];                 //clean up temporary member on access map
                        });
                        this.atHierarchy([row],segment,historicalTypePath.concat(htp),historicalLiteralPath.concat(hlp),root);
                    }});
                    */
                    if (compoundKey in compound) {
                        compound[compoundKey].rows.push(row);
                    }
                    else {
                        compound[compoundKey] = {
                            rows: [row],
                            branches: branches,
                            segment: segment
                        };
                    }
                });
                //fill segment with tail results
                Object.keys(compound).forEach((key) => {
                    let parent = this.pluck(root, historicalLiteralPath);
                    parent.push(compound[key].segment);
                    let typePath = historicalTypePath.concat(out.constructor);
                    let literalPath = historicalLiteralPath.concat([parent.length - 1]);
                    compound[key].branches.forEach((branch) => {
                        let nTypePath = typePath.concat(branch.segmentTypePath);
                        let nLiteralPath = literalPath.concat(branch.segmentLiteralPath);
                        this.atHierarchy(compound[key].rows, branch.hierarchy, nTypePath, nLiteralPath, root);
                    });
                    tails.forEach((tail) => {
                        this.pluck(compound[key].segment, tail.segmentLiteralPath, tail.map(
                            compound[key].rows,
                            historicalTypePath.concat(compound[key].segmentTypePath),
                            historicalLiteralPath.concat(compound[key].segmentLiteralPath),
                            rHierarchy,
                            branches
                        ));
                    });
                });
            });
        }
        else {
            let tails = [];
            this.atEvery(hierarchy, (input, htp, hlp) => {
                if (input.constructor === Array) {
                    this.pluck(root, hlp, this.scaffold(input));
                    this.atHierarchy(data, input, htp, hlp, root);
                    return false;
                }
                else if (input.constructor === Object && "head" in input && input.head.constructor === Function) {
                    this.pluck(root, hlp, input.head(data, htp, hlp, hierarchy));
                    return false;
                }
                else if (input.constructor === Object && "tail" in input && input.tail.constructor === Function) {
                    tails.push({
                        segmentTypePath: htp,
                        segmentLiteralPath: hlp,
                        map: input.tail
                    });
                    this.pluck(root, hlp, "");
                    return false;
                }
                else {
                    this.pluck(root, hlp, this.scaffold(input));
                }
            })
            tails.forEach((tail) => {
                this.pluck(root, tail.segmentLiteralPath, tail.map(data, tail.segmentTypePath, tail.segmentLiteralPath, hierarchy));
            });
        }
        return root;
    };
    /*  Function Name: this.atSubdivision
     *  Description: This function subdivides any 2 dimensional array into a linked tree based on the number of subdivisions specified, providing the user with
     *              a function at each subdivisions for making customizations to the subdivided area
     */
    this.atSubdivision = function (data,subdivisions=2,logic,historicalTypePath=[],historicalLiteralPath=[],rootData = data){
        if(data.length===1){
            let ntp = historicalTypePath.concat([Array]);
            let nlp = historicalLiteralPath.concat([0]);
            return data[0];
        }
        else{
            let subdivision = new Array(subdivisions).fill(null);
            let ntp = historicalTypePath.concat([Array,Object]);
            let thisRef = this;
            subdivision = subdivision.map(function(blank,index){
                let nlp = historicalLiteralPath.concat([index,"group"]);
                return thisRef.atSubdivision(data.slice(index*(data.length/subdivisions),(index+1)*(data.length/subdivisions)),subdivisions,logic,ntp,nlp);
            });
            let subdivisionGroup = { group:subdivision };
            logic(subdivisionGroup,historicalTypePath,historicalLiteralPath)
            return subdivisionGroup;
        }
    };
    /*  Function Name: this.atStructure
     *  Description: This function traverses any multidimensional set and modifies the existing path structure (metaPath) to the specified desired path structure
     */
    this.atStructure = function (data, metaPath, logic, relativity = 0, historicalTypePath = [], historicalLiteralPath = [], rootData = data) {
        /* [{... children:[{...}]}] 
         * oldMetaPath => ["children",Array]
         * newMetaPath => ["children",Object]
         * keyPaths => []
         */
    };
    /*  Function Name: this.atSegment
     *  Description: This function traverses a multidimensional set for the existence of the metaPath starting from the historicalLiteralPath, until it finds the
     *               next existence of metaPath, or the ends are primitive and returns a shallow copy
     */
    this.atSegment = function (data, metaPath, logic, relativity = 0, historicalTypePath = [], historicalLiteralPath = [], rootData = data){
        let include,exclude,depth,lag;
        if(metaPath.constructor === Object){
            include=metaPath.include;
            exclude=metaPath.exclude;
        }
        else if(metaPath.constructor === Array){
            include=metaPath;
        }
        if(relativity.constructor === Array){ 
            depth=relativity[0] || 1;
            lag=relativity[1] || 0;
        }
        else if(relativity.constructor === Object){
            depth=relativity.depth || 0;
            lag=relativity.lag || 0;
        }
        else{
            depth=relativity+1;
            lag=0;
        }
        let start = this.pluck(data,historicalLiteralPath);
        let includePaths=[];
        let excludePaths=[];
        this.atPattern(start,include,{
            "head":(data,htp,hlp,hop) => {
                if(hop.length === depth){
                    includePaths.push({
                        historicalTypePath:htp.slice(0,htp.length+lag),
                        historicalLiteralPath:hlp.slice(0,htp.length+lag),
                        historicalObjectPath:hop
                    });
                }
                else if(hop.length === (depth+1)){
                    excludePaths.push({
                        historicalTypePath:htp,
                        historicalLiteralPath:hlp,
                        historicalObjectPath:hop
                    });
                    return false;
                }
            }
        },lag);
        if(exclude){
            this.atPattern(start,exclude,{
                "head":(data,excludehtp,excludehlp,excludehop)=>{
                    for(let i=0; i<includePaths.length;i++){
                        let include = includePaths[i];
                        let includehlp = include.historicalLiteralPath;
                        if(includehlp.join("<===>").indexOf(excludehlp.join("<===>"))>-1){
                            includePaths.splice(i,1);
                            i--;
                        }
                    }
                    excludePaths.push({
                        historicalTypePath:excludehtp,
                        historicalLiteralPath:excludehlp,
                        historicalObjectPath:excludehop 
                    });
                }
            });
        }
        let segments = [];
        let excludeMap = {};
        excludePaths.forEach(exclude=>{
            excludeMap[exclude.historicalLiteralPath.join("<===>")] = true;
        });
        includePaths.forEach((include)=>{
            let reference = this.pluck(start,include.historicalLiteralPath);
            let clone = this.scaffold(reference);
            this.atEvery(reference,(data,htp,hlp,root)=>{
                let curPath = include.historicalLiteralPath.concat(hlp).join("<===>");
                if(curPath in excludeMap){
                    return false;
                }
                this.pluck(clone,hlp,this.clone(this.scaffold(data)));
            });
            segments.push({
                data:clone,
                historicalTypePath:include.historicalTypePath,
                historicalLiteralPath:include.historicalLiteralPath,
                historicalObjectPath:include.historicalObjectPath
            });
            logic(clone,include.historicalTypePath,include.historicalLiteralPath,include.historicalObjectPath,data);
        });
        return segments;
    };
    /* 	Function Name: this.atMeta
     *	Description: This function iterates through values which have matching literal/typepaths from the base of the object
     */
    this.atMeta = function (data, metaPath, logic, relativity = 0, historicalTypePath = [], historicalLiteralPath = [], historicalObjectPath = [], rootData = data) {
        return this.atPattern(data, metaPath, { "head":logic }, relativity, historicalTypePath, historicalLiteralPath, null, data, true);
    };
    /*	Function Name: this.atPattern
     *	Description: This function iterates through values which have matching literal/typepaths throughout the entirety of an object 
     */
    this.atPattern = function (data, metaPath, logic, relativity = 0, historicalTypePath = [], historicalLiteralPath = [], curMeta, rootData = data, direct=false) {
        let matched = {};   
        let aData;
        let metaTemplate = {
            matchCount:0,
            hop:[]
        };
        let newMeta = [];
        if (metaPath[0].constructor === Array) {
            if (curMeta) {}
            else {
                newMeta = [];
                for (let i = 0; i < metaPath.length; i++) {
                    newMeta.push(this.clone(metaTemplate));
                }
            }
        }
        else {
            metaPath = [metaPath];
            newMeta = [metaTemplate];
        }
        if (historicalLiteralPath.length > 0) {
            let matchExists = false;
            
            for (let i = 0; i < metaPath.length; i++) {
                newMeta[i]={
                    matchCount: this.clone(curMeta[i].matchCount),
                    hop:curMeta[i].hop
                };
                if(direct && historicalLiteralPath.length > metaPath[i].length){
                    newMeta[i].matchCount = metaPath[i].length + 1;
                }
                if ( metaPath[i][newMeta[i].matchCount] !== undefined && historicalTypePath[historicalTypePath.length - 1].name === metaPath[i][newMeta[i].matchCount].name) {
                    newMeta[i].matchCount++;
                    matchExists = true;
                }
                else if (metaPath[i][newMeta[i].matchCount] !== undefined && historicalLiteralPath[historicalLiteralPath.length - 1] === metaPath[i][newMeta[i].matchCount]) {
                    newMeta[i].matchCount++;
                    matchExists = true;
                }
                else {
                    newMeta[i].matchCount = 0;
                }
                if (newMeta[i].matchCount === metaPath[i].length) {
                    var continueTraversal;
                    aData = relativity === 0 ? data : this.pluck(rootData, historicalLiteralPath.slice(0, (historicalLiteralPath.length) + relativity));
                    newMeta[i].hop = newMeta[i].hop.concat([{ data: aData }]);
                    let frozenHopIndex = newMeta[i].hop.length - 1;
                    let frozenMetaIndex = this.clone(i);
                    if (frozenHopIndex > 0) {
                        newMeta[i].hop[frozenHopIndex].previous = () => {
                            return newMeta[frozenMetaIndex].hop[frozenHopIndex - 1];
                        };
                        newMeta[i].hop[frozenHopIndex].previous().next = () => {
                            return newMeta[frozenMetaIndex].hop[frozenHopIndex];
                        };
                    }
                    continueTraversal = this.executeLogic(logic, "head", i, aData, historicalTypePath, historicalLiteralPath, newMeta[i].hop, rootData);
                    matched[i] = aData;
                    if (continueTraversal === false) {
                        return aData;
                    }
                    newMeta[i].matchCount = 0;
                }
            }
            if(direct && !matchExists){
                return false;
            }
        }
        if (data !== null) {
            if((!direct) && this.isCircular(data)){
                console.log("data traversal halted @ "+historicalLiteralPath.join("-"))
                return data;
            }
            var nhtpath = historicalTypePath.slice(0);
            nhtpath.push(data.constructor);
            if (data.constructor === Array) {
                for (let i = 0; i < data.length; i++) {
                    let nhlpath = this.clone(historicalLiteralPath);
                    nhlpath.push(i);
                    this.atPattern(data[i], metaPath, logic, relativity, nhtpath, nhlpath, newMeta, rootData, direct);
                }
            }
            else if (data.constructor === Object || (typeof data == 'object' && data !== null) ) {
                if( data.constructor.name in this.typeExtensions ){
                    this.typeExtensions[data.constructor.name].enumerators.forEach((enumerator)=>{
                        enumerator(data, metaPath, logic, relativity, nhtpath, historicalLiteralPath, newMeta, rootData, direct);
                    });
                }
                else{
                    Object.keys(data).forEach((key) => {
                        let nhlpath = this.clone(historicalLiteralPath);
                        nhlpath.push(key);
                        this.atPattern( data[key], metaPath, logic, relativity, nhtpath, nhlpath, newMeta, rootData, direct);
                    });
                }
            }
        }
        for (let i = 0; i < metaPath.length; i++) {
            if (i in matched) {
                continueTraversal = this.executeLogic(logic, "tail", i, aData, historicalTypePath, historicalLiteralPath, newMeta[i].hop, rootData);
                if (continueTraversal === false) {
                    return aData;
                }
            }
        }
        if(data === rootData){
            this.clearAccessMap();
        }
        return data;
    };
    /*	Function Name: this.atShallowestPattern
     *	Description: This function iterates this.atPattern, stores the inputs with the least depth to be executed logically
     */
    this.atShallowestPattern = function (data, metaPath, logic, relativity = 0) {
        var leastDepth = Infinity;
        let inputs = [];
        this.atPattern(data, metaPath,{ "head":function (input, historicalTypePath, historicalLiteralPath, historicalObjectPath) {
                if (historicalLiteralPath.length < leastDepth) {
                    leastDepth = historicalLiteralPath.length;
                    inputs = [];
                }
                else if (historicalLiteralPath.length > leastDepth) {
                    return false;
                }
                inputs.push({
                    data: input,
                    historicalTypePath: historicalTypePath,
                    historicalLiteralPath: historicalLiteralPath,
                    historicalObjectPath: historicalObjectPath
                });
            }
        }, relativity);
        for (let i = 0; i < inputs.length; i++) {
            logic(inputs[i].data, inputs[i].historicalTypePath, inputs[i].historicalLiteralPath, inputs[i].historicalObjectPath);
        }
        return data;
    };
    /*	Function Name: this.atDeepestPattern
     *	Description: This function iterates this.atPattern, stores the inputs with most depth to be executed logically - (Returns false within .atPattern where depth is greater than)
     */
    this.atDeepestPattern = function (data, metaPath, logic, relativity = 0) {
        var greatestDepth = -1;
        let inputs = [];
        this.atPattern(data, metaPath, function (input, historicalTypePath, historicalLiteralPath, historicalObjectPath) {
            if (historicalLiteralPath.length > greatestDepth) {
                greatestDepth = historicalLiteralPath.length;
                inputs = [];
            }
            inputs.push({
                data: input,
                historicalTypePath: historicalTypePath,
                historicalLiteralPath: historicalLiteralPath,
                historicalObjectPath: historicalObjectPath
            });
        }, relativity);
        for (let i = 0; i < inputs.length; i++) {
            logic(inputs[i].data, inputs[i].historicalTypePath, inputs[i].historicalLiteralPath, inputs[i].historicalObjectPath);
        }
        return data;
    };
    /* 	Function Name: this.atEnds
     *	Description: This function iterates through the primitive ends of objects
     */
    this.atEnds = function (data, logic, historicalTypePath = [], historicalLiteralPath = []) {
        if (data.constructor === Object) {
            Object.keys(data).forEach((key) => {
                let ntp = historicalTypePath.concat([Object]);
                let nlp = historicalLiteralPath.concat([key]);
                this.atEnds(data[key], logic, ntp, nlp);
            })
        }
        else if (data.constructor === Array) {
            for (let i = 0; i < data.length; i++) {
                let ntp = historicalTypePath.concat([Array]);
                let nlp = historicalLiteralPath.concat([i]);
                this.atEnds(data[i], logic, ntp, nlp);
            }
        }
        else if (data.constructor === Function) {
            if (this.funcArgs(data).length === 0) {
                let ntp = historicalTypePath.concat([Function]);
                let nlp = historicalLiteralPath.concat(data);
                this.atEnds(data(logic, ntp, nlp), logic, ntp, nlp)
            }
        }
        else {
            logic(data, historicalTypePath, historicalLiteralPath);
        }
        return data;
    };
    /*	Function Name: this.atEvery
     * 	Description: This function runs passed logic at every potential traversal or endpoint
     */
    this.atEvery = function (data, logic, historicalTypePath = [], historicalLiteralPath = [], rootData = data) {
        let iContinue = logic(data, historicalTypePath, historicalLiteralPath, rootData);
        if (!(iContinue === true || iContinue === undefined || iContinue === null)) {
            return;
        }
        var newTypePath = this.clone(historicalTypePath);
        newTypePath.push(data.constructor);
        if (data.constructor === Array) {
            for (let i = 0; i < data.length; i++) {
                var newLitPath = this.clone(historicalLiteralPath);
                newLitPath.push(i);
                this.atEvery(data[i], logic, newTypePath, newLitPath, rootData);
            }
        }
        else if (data.constructor === Object || (typeof data == 'object')) {
            Object.keys(data).forEach((key) => {
                var newLitPath = this.clone(historicalLiteralPath);
                newLitPath.push(key);
                this.atEvery(data[key], logic, newTypePath, newLitPath, rootData);
            });
        }
        return data;
    };
    /*	Function Name: this.atMetaEnds
     * 	Description: This function runs this.atMeta, and then performs logic at the ends of the object returned to it by this.atMeta
     */
    this.atMetaEnds = function (data, metaPath, logic) {
        var recursiveRef = this;
        recursiveRef.atMeta(data, metaPath, {
            "head":function (input) {
                recursiveRef.atEnds(input, logic);
            }
        });
        return data;
    };
    /*	Function Name: this.atPatternEnds
     *	Description: This function runs this.atPattern, and then performs logic at the pattern of the object returned to it by this.atPattern
     */
    this.atPatternEnds = function (data, metaPath, logic, relativity = 0) {
        var recursiveRef = this;
        recursiveRef.atPattern(data, metaPath, function (input) {
            recursiveRef.atEnds(input, logic);
        }, relativity);
        return data;
    };
    /*	Function Name: this.atMatching
     *	Description: This function traverses through set, determining if same path exists in data, and executes the associated path function "atMatchingFunction" or the sequence
     */
    this.atMatching = function (data, set, metaPath = [], literalPath = []) {
        var curObj = this.pluck(set, metaPath);
        var curData;
        var exists = false;
        try {
            curData = this.pluck(data, metaPath);
            exists = true;
        }
        catch (exception) {
            exists = false;
        }
        if (curObj.constructor.name === "Object") {
            Object.keys(curObj).forEach((key) => {
                var nMetaPath = this.clone(metaPath);
                nMetaPath.push(key);
                var nLiteralPath = this.clone(literalPath);
                nLiteralPath.push(key);
                this.atMatching(data, set, nMetaPath, nLiteralPath);

            });
        }
        else if (curObj.constructor.name === Array && exists) {
            for (let i = 0; i < curObj.length; i++) {
                var nMetaPath = this.clone(metaPath);
                nMetaPath.push(i);
                for (var x = 0; x < curData.length; x++) {
                    var nLiteralPath = this.clone(literalPath);
                    nLiteralPath.push(x);
                    this.atMatching(data, set, nMetaPath, nLiteralPath);
                }
            }
        }
        else if (curObj.constructor === Function) {
            if (metaPath[metaPath.length - 1] === "atMatchingFunction") {
                //Perform Logic at Path of data object
                curObj(this.pluck(data, literalPath.slice(0, - 1)), this)
            }
        }
        else if (curObj.constructor.name === String) {
            if (metaPath[metaPath.length - 1] === "atMatchingFunction") {
                //Perform Logic at Path of data object
                window[curObj](this.pluck(data, literalPath.slice(0, - 1)), this)
            }
            else if (exists) {
                curData += curObj
            }
        }
        else if (curObj.constructor === Number && exists) {
            //Do an Equivalence Modifier
            if (curData.constructor.name === curObj.constructor.name) {
                curData += curObj;
            }
        }
    };
    /*	Function Name: this.atDepth
     *	Description: This function traverses through set, pushing all items at a dimensional depth from base into an array and returning them
     */
    this.atDepth = function (data, depth = 0, logic, historicalTypePath = [], historicalLiteralPath = [], first = true, rootData = data) {
        if (first === true) {
            this.atDepthContainer = [];
            first = false;
        }
        if (depth > 0) {
            depth--
            if (data.constructor.name === "Object") {
                Object.keys(data).forEach((key) => {
                    this.atDepth(data[key], depth, logic, first);
                })
            }
            else if (data.constructor.name === "Array") {
                for (let i = 0; i < data.length; i++) {
                    this.atDepth(data[i], depth, logic, first);
                }
            }
        }
        else {
            logic(data, historicalTypePath, historicalLiteralPath, rootData);
            this.atDepthContainer.push(data);
        }

        return this.atDepthContainer;
    };
    /*	Function Name: this.atDiff
     *	Description: This function traverses through multiple sets, keeping track of the structural and data differentials between all listed sets. Base sets must be held in array form. strict == true will modify contents to exactly match RFC 6902 standard
     */
    this.atDiff = function (data, logic = null, primary = 0, strict = false) {
        let PatchDiffs = [];
        if (data.constructor === Array) {
            if (data.length > 1) {
                //add, replace checks
                this.atEvery(data[primary], (curData, historicalTypePath, historicalLiteralPath, rootData) => {
                    for (var secondary = 0; secondary < data.length; secondary++) {
                        if(secondary !== primary){
                            //compare primary set to others
                            let secondaryPathExists = this.pathExists(data[secondary], historicalLiteralPath);
                            if (secondaryPathExists && secondaryPathExists.constructor === Boolean) {
                                if (curData.constructor !== Object && curData.constructor !== Array) {
                                    let compareSetVal = this.pluck(data[secondary], historicalLiteralPath);
                                    if (curData === compareSetVal) {
                                        //set equivalent
                                    }
                                    else {
                                        let nlp = historicalLiteralPath.slice(0);
                                        //set requires updating to base set
                                        let patch = this.RFC6902({ "op": "replace", "path": nlp, "value": curData, "ref": data[secondary], "#":secondary }, strict);
                                        PatchDiffs.push(patch);
                                        if (logic != null) {
                                            logic(patch, historicalTypePath, historicalLiteralPath, rootData);
                                        }
                                    }
                                }
                            }
                            else {
                                let nlp = historicalLiteralPath.slice(0);
                                let patch = this.RFC6902({ "op": "add", "path": nlp, "value": curData, "ref": data[secondary], "#":secondary }, strict);
                                PatchDiffs.push(patch);
                                if (logic != null) {
                                    logic(patch, historicalTypePath, historicalLiteralPath, rootData);
                                }
                                return false;
                            }
                        }
                    }
                });
                //removal checks
                for(var secondary=0; secondary < data.length; secondary++){
                    if(secondary !== primary){
                        this.atEvery(data[secondary], (curData, historicalTypePath, historicalLiteralPath, rootData) => {
                            //compare secondary set to primary
                            let primaryPathExists = this.pathExists(data[primary], historicalLiteralPath);
                            if (!(primaryPathExists && primaryPathExists.constructor === Boolean)) {
                                let nlp = historicalLiteralPath.slice(0);
                                let patch = this.RFC6902({ "op": "remove", "path": nlp, "value": curData, "ref": data[secondary], "#":secondary }, strict);
                                PatchDiffs.push(patch);
                                if (logic != null) {
                                    logic(patch, historicalTypePath, historicalLiteralPath, rootData);
                                }
                                return false;
                            }
                        });
                    }
                }
            }
            else {
                console.log("Nothing to compare against");
            }
        }
        else {
            console.log("Base data is not an array");
        }
        return PatchDiffs;
    };
    this.RFC6902 = function (patch, strict = false) {
        if(strict){
            delete patch["ref"];
            delete patch["#"];
            patch["path"] = "/" + patch["path"].join("/");
        }
        return patch;
    }
})();

try {
    module.exports = grul;
    console.log("Node Load");
}
catch (exception) {
    grul.pluck = function (data, path, set = null) {
        if (path.length > 1) {
            return this.pluck(data[path[0]], path.slice(1), set);
        }
        else if (path.length === 0) {
            if (set === null) {
                return data;
            }
            else {
                data = set;
                return data;
            }
        }
        else {
            if (set === null) {
                if (data instanceof HTMLElement) {
                    return data.getAttribute(path[0]);
                }
                else {
                    return data[path[0]];
                }
            }
            else {
                data[path[0]] = set;
                return data[path[0]];
            }
        }
        
    };
    console.log("Vanilla JavaScript Load");
}