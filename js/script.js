(() => {
  let variables = {
    lists: {
      characters: {list: ["Jane", "George", "Mark", "Susan"], inputId: "name"},
      expressions: {list: ["Neutral", "Sad", "Angry", "Cheerful"], inputId: "expression"},
      actions: {list: ["Running", "Staring ahead", "Walking slowly"], inputId: "action"},
    },
    styleMap: {},
    inputs: [
      "name",
      "expression",
      "action",
      "line"
    ],
    lines: [
      {
        "name": "Jane",
        "expression": "Cheerful",
        "action": "",
        "line": "Hello, my name is Jane. Add characters, actions, and expressions to your script by writing them in the inputs under'Presets.",
        "color": {
          "background": "54,103,126",
          "font": "0,0,0"
        }
      },
      {
        "name": "George",
        "expression": "Cheerful",
        "action": "Walking slowly",
        "line": "My name is George. Save your script as JSON file with the \"SAVE FILE\" button, or open a script with the same JSON schema with the \"OPEN FILE\" button.",
        "color": {
          "background": "42,167,114",
          "font": "0,0,0"
        }
      },
      {
        "name": "Mark",
        "expression": "Neutral",
        "action": "Running",
        "line": "Hello to everyone! Can't talk, I'm late for class! Notice that my expression is different than everyone, and that I'm 'running' to class.",
        "color": {
          "background": "184,139,184",
          "font": "0,0,0"
        }
      },
      {
        "name": "Susan",
        "expression": "Cheerful",
        "action": "",
        "line": "Well Hi, \"Late for class,\" I'm Susan. You can edit or delete dialogue by hovering your cursor and clicking \"EDIT\" or \"DELETE.\"",
        "color": {
          "background": "53,91,177",
          "font": "0,0,0"
        }
      }
    ]
  };

  window.onload = () => {
   initialize();
 };

 function initialize() {
   let controls = [
     {selector: "#dialogue button", event: "click", function: newLine},
     {selector: "#json-import", event: "change", function: importJSONFile},
     {selector: "#json-export", event: "click", function: saveJSONFile},
     {selector: "#dialogue-clear", event: "click", function: clear},
   ];
   controls.forEach(item => {
     let control = document.querySelector(item.selector);
     control.addEventListener(item.event, item.function);
   });

   nunjucks.configure('/templates');

   setStyles();
   loadLists();
   loadLines();
 }

 function clear() {
   if(getConfirmation("Are you sure you want to clear all data?")) {
     variables.lists.characters.list = [];
     variables.lists.expressions.list = [];
     variables.lists.actions.list = [];
     variables.styleMap = {};
     variables.lines = [];
     loadLists();
     loadLines();
   }
 }

  function loadLists() {
    var lists = document.getElementById("lists");
    Object.keys(variables.lists).forEach(key => {
      let selector = `#list-${key} textarea`;
      let list = document.querySelector(selector);
      list.value = variables.lists[key].list.toString().replace(/,/g, "\n");
      list.addEventListener("blur", ev => {
        try {
          let input = ev.target;
          let key = input.getAttribute("data-id");
          let newList = input.value.split("\n");
          variables.lists[key].list = newList;
          setStyles();
          populateInputs();
        }
        catch(exception) {console.log("Load List Error")}
      });
    })
  }

  function generateStyle(string) {
    let style = {};
    let rgb = [];
    let luminanceMultipliers = [0.2126, 0.7152, 0.0722];
    let luminance = 0;
    let lightness = 0;
    let totalColorCount = 256 * 256 * 256;

    let stringCharCodeProduct = 1
    for(let i = 0; i < string.length; i++) {
      stringCharCodeProduct *= string.charCodeAt(i);
    }

    let stringCode = string.length * stringCharCodeProduct;
    let colorValue = (stringCode <= totalColorCount) ? stringCode : stringCode % totalColorCount;
    let hexValue = (colorValue - 1).toString(16);
    let colorIndex = 0;

    while(colorIndex < 3) {
      let digitOne = (hexValue[0 + colorIndex]) ? hexValue[0 + colorIndex] : "0";
      let digitTwo = (hexValue[1 + colorIndex]) ? hexValue[1 + colorIndex] : "0";
      let currentColor = `${digitOne}${digitTwo}`;
      let colorInt = parseInt(currentColor, 16);
      let linearColorChannel = ((colorInt / 255) <= 0.04045) ? (colorInt / (255 * 12)) : Math.pow((((colorInt / 255) + 0.055)/1.055),2.4);
      rgb.push(colorInt);
      luminance += luminanceMultipliers[colorIndex] * linearColorChannel;
      colorIndex++;
    }

    style.background = rgb.toString();
    lightness = (luminance <= (216/24389)) ? (luminance * (24389/27)) : (Math.pow(luminance, (1/3)) * 116 - 16);
    style.font = (lightness > 50) ? [0, 0, 0].toString() : [255, 255, 255].toString();

    return style;
  }

  function setStyles() {
    variables.lists.characters.list.forEach(string => {
      variables.styleMap[string] = generateStyle(string);
    });
  }

  function loadLines() {
    let box = document.getElementById("dialog-box");
    let lines = variables.lines.map(line => {
      line.color = variables.styleMap[line.name];
      return line;
    });
    let html = nunjucks.render('bubbles.njk', {lines: lines});
    box.innerHTML = html;

    document.querySelectorAll(".edit-btn").forEach(button => {
      button.addEventListener("click", ev => {
        let line = ev.target;
        let index = line.getAttribute("data-index");
        editLine(index);
      });
    });

    document.querySelectorAll(".delete-btn").forEach(button => {
      button.addEventListener("click", ev => {
        let line = ev.target;

        if(!getConfirmation("Are you sure you want to delete this line of dialogue?")) {
          return;
        }

        let index = line.getAttribute("data-index");
        let newLines = variables.lines.filter((line, i) => i !== Number(index));
        variables.lines = newLines;
        loadLines();
      });
    });

    loadJSONPreview();
  }

  function newLine() {
    if(document.querySelector(".bubble-input")) {
      return;
    }

    let box = document.getElementById("dialog-box");

    let html = nunjucks.render('bubble-inputs.njk');
    let bubble = stringToDom(html);
    box.appendChild(bubble);

    let form = document.querySelector(".bubble-input form");
    form.addEventListener("submit", ev => {
      ev.preventDefault();
      let line = {};

      variables.inputs.forEach(inputId => {
        let input = document.getElementById(inputId);
        line[inputId] = input.value;
      });

      variables.lines.push(line);
      loadLines();
    });

    let closeBtn = document.querySelector("#close-bubble-form");
    closeBtn.addEventListener("click", ev => {
      box.removeChild(document.querySelector(".bubble-input"));
    });

    populateInputs();
  }


    function editLine(lineIndex) {
      if(document.querySelector(".bubble-input")) {
        return;
      }

      let box = document.getElementById("dialog-box");
      let html = nunjucks.render('bubble-inputs.njk');
      let bubbleInput = stringToDom(html);
      let line = document.querySelector(`div.dialogue-line[data-index='${lineIndex}']`)
      box.replaceChild(bubbleInput, line);

      populateInputs();

      variables.inputs.forEach(selector => {
        let value = variables.lines[lineIndex][selector];
        document.getElementById(selector).value = value;
      });

      let form = document.querySelector(".bubble-input form");
      form.addEventListener("submit", ev => {
        ev.preventDefault();
        let line = {};

        variables.inputs.forEach(inputId => {
          let input = document.getElementById(inputId);
          line[inputId] = input.value;
        });

        variables.lines[lineIndex] = line;
        loadLines();
      });

      let closeBtn = document.querySelector("#close-bubble-form");
      closeBtn.addEventListener("click", ev => {
        loadLines();
      });
    }

  function populateInputs() {
    Object.keys(variables.lists).forEach(key => {
      let selector = `#${variables.lists[key].inputId}`;
      let input = document.querySelector(selector);
      if(!input) {
        return;
      }
      input.innerHTML = `<option value selected disabled>Choose ${key}</option>`;
      variables.lists[key].list.forEach(item => {
        let option = document.createElement("option");
        option.innerHTML = item;
        option.value = item;
        input.appendChild(option);
      });
    });
  }

  function buildJSONString() {
    let array = variables.lines.slice(0);
    return JSON.stringify(array, null, 2);
  }

  function loadJSONPreview() {
    document.querySelector("#json-preview").value = buildJSONString();
  }

  function importJSONFile(ev) {
    let file = ev.target.files[0];
    let reader = new FileReader();

    reader.onload = ev => {
      let string = ev.target.result;
      try {
        clear();
        let array = JSON.parse(string);
        importDataFromLines(array);
        setStyles();
        loadLists();
        variables.lines = array;
        loadLines();
      }
      catch(exception) {console.log("File Read Error");console.log(exception);}
    };
    reader.readAsText(file);
  }

  function importDataFromLines(lines) {
    lines.forEach(line => {
      Object.keys(variables.lists).forEach(listName => {
        let property = variables.lists[listName].inputId;
        if(variables.lists[listName].list.indexOf(line[property]) < 0) {
          variables.lists[listName].list.push(line[property]);
        }
      });
    });
    console.log(variables);
  }

  function saveJSONFile() {
    let array = variables.lines.slice(0);
    let string = JSON.stringify(array);
    let blob = new Blob([buildJSONString()], {
      type: "application/json",
    });
    let url = window.URL.createObjectURL(blob);
    let a = document.createElement("a");
    a.style.display = "none";
    a.href = url;
    a.download = `dialogue-${(new Date).toJSON()}.json`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
  }

  function stringToDom(string) {
    let div = document.createElement("div");
    div.innerHTML = string;
    return div.children[0];
  }

  function getConfirmation(prompt) {
    return confirm(prompt);
  }

  function notify(message) {
    alert(message);
  }
})();
