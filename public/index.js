class Notes {
    constructor() { 
        this.history = [];
        this.recall = [];
    }

    executeCommand(command) {
        command.execute();
        this.history.push(command);
        this.clearRecall();
    }

    undo() {
        if(this.history.length > 0)
        {
            const command = this.history.pop();
            this.recall.push(command);
            command.undo();
            $("#history-message").text(command.getMessage("undo"));
        }
    }

    redo() {
        if(this.recall.length > 0)
        {
            const command = this.recall.pop();
            this.history.push(command);
            command.redo();
            $("#history-message").text(command.getMessage("redo"));
        }
    }

    clearHistory() { this.history = []; }

    clearRecall() { this.recall = []; }
}

class AddNoteCommand {
    constructor() { this.note = null; }

    execute() { this.note = addNote(); }

    undo() { deleteNote(this.note); }

    redo() { 
        $("#note-container").append(this.note);
        changeNoteVisibility(this.note, false);     
    }

    getMessage(type) { return type === "undo" ? "Undid create note" : "Redid create note"; }
}

class DeleteNoteCommand {
    constructor(note) { this.note = note; }

    execute() { deleteNote(this.note); }

    undo() { 
        $("#note-container").append(this.note);
        changeNoteVisibility(this.note, false);
     }

    redo() { this.execute(); }

    getMessage(type) { return type === "undo" ? "Undid delete note" : "Redid delete note"; }
}

class ChangeColorCommand {
    constructor(note, prevColor) {
        this.note = note;
        this.prevColor = prevColor;
        this.newColor = null;
    }

    execute() {
        this.newColor = this.note.children("input").val();
        this.note.css({"background-color": this.newColor});
        this.note.children("textarea").css({"background-color": this.newColor});
    }

    undo() {
        this.note.css({"background-color": this.prevColor});
        this.note.children("textarea").css({"background-color": this.prevColor});
        this.note.children("input").val(convertRGBToHex(this.prevColor));
    }

    redo() {
        this.note.css({"background-color": this.newColor});
        this.note.children("textarea").css({"background-color": this.newColor});
        this.note.children("input").val(this.newColor);
    }

    getMessage(type) { return type === "undo" ? "Undid note color change" : "Redid note color change"; }
}

class LockNoteCommand {
    constructor(note) { this.note = note; }

    execute() { lockNote(this.note); }

    undo() { this.execute(); }

    redo() { this.execute(); }

    getMessage(type) { return type === "undo" ? "Undid note lock change" : "Redid note lock change"; }
}

const notes = new Notes();
$(document).ready(() => {
    $("#add-note").on("click", () => notes.executeCommand(new AddNoteCommand()));

    $("#save-workspace").on("click", storeNotes);

    $("#settings").on("click", () => document.querySelector("#settings-modal").showModal());
    $("#close-btn").on("click", () => {
        document.querySelector("#settings-modal").close();
        localStorage.setItem("settings", JSON.stringify({hideUI: $("#hide-ui").is(":checked")}));
    });

    $("#hide-ui").on("click", (e) => {
        $("#add-note").toggle(!$(e.target).is(":checked"));
        $("#save-workspace").toggle(!$(e.target).is(":checked"));
        $("#history-container").toggle(!$(e.target).is(":checked"));
    });

    $("#undo-btn").on("click", () => notes.undo());
    $("#redo-btn").on("click", () => notes.redo());

    hotkeys("ctrl+s", (e) => {
        e.preventDefault();
        storeNotes();
    });

    hotkeys("alt+n", (e) => {
        e.preventDefault();
        notes.executeCommand(new AddNoteCommand())
    });

    hotkeys("ctrl+z", (e) => {
        e.preventDefault();
        notes.undo();
    });

    hotkeys("ctrl+y", (e) => {
        e.preventDefault();
        notes.redo();
    });

    let notesArr = JSON.parse(localStorage.getItem("notes"));
    if(notesArr !== null)
    {
        let idx = 0;
        notesArr.forEach((item) => {
            addNote();
            let note = $(".note")[idx];
            note.style.top = item.top;
            note.style.left = item.left;
            note.style.backgroundColor = item.color;
            let hexColor = convertRGBToHex(item.color);
            $(note).children("textarea").css({"background-color": item.color});
            $(note).children("textarea").val(item.text);
            $(note).children("input").val(hexColor);
            if(item.lock) lockNote($(note));
            note.style.zIndex = item.zIdx;
            $(note).children("textarea").css({"height": item.textHeight});
            idx++;
        });
    }

    let settings = JSON.parse(localStorage.getItem("settings"));
    if(settings && settings.hideUI)
        $("#hide-ui").trigger("click");

    $(window).on("beforeunload", (e) => {
        let changesMade = false;
        let unsavedStr = "You have unsaved changes.";
        let storageArr = JSON.parse(localStorage.getItem("notes"));
        if(storageArr === null) storageArr = [];
        const currentNotes = $(".note");

        if(storageArr.length !== currentNotes.length)
            return unsavedStr;

        for(let i = 0;i < storageArr.length;i++)
        {
            if(storageArr[i].top !== currentNotes[i].style.top || storageArr[i].left !== currentNotes[i].style.left ||
                storageArr[i].color !== currentNotes[i].style.backgroundColor || storageArr[i].text !== $(currentNotes[i]).children("textarea").val() ||
                storageArr[i].zIdx !== currentNotes[i].style.zIndex)
            {
                if(!(storageArr[i].lock && $(currentNotes[i]).children("#lock-btn").hasClass("locked")) ||
                !(!storageArr[i].lock && !$(currentNotes[i]).children("#lock-btn").hasClass("locked")))
                    changesMade = true;
            }
        }
        
        if(changesMade) return unsavedStr;
    });
});

function sendNoteToFront(e) {
    let maxIdx = 0;
    $(".note").each((_, obj) => {
        if(parseInt($(obj).css("z-index")) > maxIdx)
            maxIdx = parseInt($(obj).css("z-index"));
    });

    $(e.target).css({"z-index": maxIdx + 1});
}

function triggerParentNoteClick(e) { $(e.target).parent().trigger("click"); }

function storeNotes() {
    let notesArr = [];
    
    $(".note").each((_, obj) => {
        let note = {};
        note.text = $(obj).children("textarea").val();
        note.top = obj.style.top;
        note.left = obj.style.left;
        note.color = obj.style.backgroundColor;
        note.lock = $(obj).hasClass("ui-draggable-disabled");
        note.zIdx = $(obj).css("z-index");
        note.textHeight = $(obj).children("textarea").css("height");
        notesArr.push(note);
    });
    localStorage.setItem("notes", JSON.stringify(notesArr));
    notes.clearHistory();
    notes.clearRecall();
    $("#history-message").text("");
}

function addNote() {
    let note = $("<div class=\"note\"></div>");
    let deleteBtn = $("<button id=\"delete-btn\">X</button>");
    let colorSelect = $("<input type=\"color\" value=\"#FFFF88\"></input>");
    let lock = $("<button id=\"lock-btn\">LOCK</button>");
    let textArea = $("<textarea></textarea>");

    note.draggable({drag: function(e) {
        $(".note").each((_, obj) => {
            changeNoteVisibility(obj, false);
        });
        
        changeNoteVisibility(e.target, true);
        sendNoteToFront(e);
    }, disabled: lock.hasClass("locked"), distance: 25});
    note.css({"background-color": `${colorSelect.val()}`, "width": "250px", "position": "fixed", "top": "0", "left": "0", "z-index": "0"});

    deleteBtn.css({"position": "absolute", "right": "0", "margin": "-7px", "background-color": "#FF3131", "border": "2px #4A0404 solid",
                    "font-weight": "bolder", "border-radius": "50%", "visibility": "hidden", "width": "25px", "height": "25px"});
    deleteBtn.on("click", (e) => {
        notes.executeCommand(new DeleteNoteCommand($(e.target).parent()));
    });
    note.append(deleteBtn);

    colorSelect.css({"height": "50px", "width": "50px", "margin": "20px 0 5px 5px", "visibility": "hidden"});
    note.append(colorSelect);

    lock.on("click", (e) => {
        notes.executeCommand(new LockNoteCommand($(e.target).parent()))
    });
    lock.css({"float": "right", "height": "50px", "margin": "20px 5px 5px 0", "visibility": "hidden"});
    note.append(lock);

    textArea.css({"width": "230px", "padding": "0", "border": "0", "resize": "none", "background-color": `${colorSelect.val()}`,
                "min-height": "150px", "overflow-y": "hidden", "outline": "0", "margin": "0 10px 10px 10px"});
    textArea.on("input", () => {
        textArea.css({"height": "auto"});
        textArea.css({"height": textArea[0].scrollHeight + "px"});
    });
    textArea.on('touchstart', function() {
        $(this).focus();
    });
    textArea.on("focus", (e) => { 
        triggerParentNoteClick(e);
    });
    note.append(textArea);

    colorSelect.on("change", (e) => {
        notes.executeCommand(new ChangeColorCommand($(e.target).parent(), $(e.target).parent().css("background-color")));
    });

    note.on("mouseenter", () => {
        changeNoteVisibility(note, true);
    }).on("mouseleave", () => {
        changeNoteVisibility(note, false);
    });

    note.on("click", (e) => {
        e.stopPropagation();
        sendNoteToFront(e);

        $(".note").each((_, obj) => {
            changeNoteVisibility(obj, false);
        });

        changeNoteVisibility(note, true);
    });
    note.children().each((_, obj) => $(obj).on("click", triggerParentNoteClick));

    $(document).on("click", () => {
        $(".note").each((_, obj) => {
            changeNoteVisibility(obj, false);
        });
    });

    $("#note-container").append(note);
    return note;
}

function changeNoteVisibility(note, visible) {
    let visibility = "hidden";
    if(visible) visibility = "visible";
    $(note).children("#lock-btn").css({"visibility": visibility});
    $(note).children("input").css({"visibility": visibility});
    $(note).children("#delete-btn").css({"visibility": visibility}); 
}

function deleteNote(note) { note.detach(); }

function lockNote(note) {
    let dragEnabled = false;
    let lock = note.children("#lock-btn");
    lock.text("UNLOCK");
    lock.addClass("locked");
    if(note.is(".ui-draggable-disabled")) {
     lock.removeClass("locked");
     dragEnabled = true;
     lock.text("LOCK");
    }
    note.draggable({disabled: !dragEnabled});
}

function convertRGBToHex(rgbStr) { return '#' + rgbStr.slice(4,-1).split(',').map(x => (+x).toString(16).padStart(2,0)).join(''); }