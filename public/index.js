class Notes {
    constructor() {
        this.notesArr = [];
        this.history = [];
    }

    executeCommand(command) {
        command.execute(this.notesArr);
        this.history.push(command);
        console.log(this.history)
        console.log(this.notesArr)
    }

    undo() {
        const command = this.history.pop();
        command.undo(this.notesArr);
        console.log(this.history)
        console.log(this.notesArr)
    }
}

class AddNoteCommand {
    constructor() {
        this.note = null;
    }

    execute(arr) { 
        this.note = addNote();
        arr.push(this.note); 
    }

    undo(arr) {
        let idx = arr.findIndex((item) => item.is(this.note));
        arr.splice(idx, 1);

        deleteNote(this.note);
    }
}

class DeleteNoteCommand {
    constructor(note) {
        this.note = note;
    }

    execute(arr) {
        let idx = arr.findIndex((item) => item.is(this.note));
        arr.splice(idx, 1);

        deleteNote(this.note);
    }

    undo(arr) {
        addNote(this.note);
        arr.push(this.note);
    }
}

const notes = new Notes();
$(document).ready(() => {
    $("#add-note").on("click", () => {
        notes.executeCommand(new AddNoteCommand())
    });

    hotkeys("ctrl+z", (e) => {
        e.preventDefault();
        notes.undo();
    });

    $("#save-workspace").on("click", storeNotes);

    $("#settings").on("click", () => document.querySelector("#settings-modal").showModal());

    $("#close-btn").on("click", () => document.querySelector("#settings-modal").close())

    $("#settings-modal > input").on("click", () => {
        $("#add-note").toggle(!$("#hide-ui").is(":checked"));
        $("#save-workspace").toggle(!$("#hide-ui").is(":checked"));
    });

    let notesArr = JSON.parse(localStorage.getItem("notes"));
    if(notesArr !== null)
    {
        let idx = 0;
        notesArr.forEach((item) => {
            $("#add-note").trigger("click");
            let note = $(".note")[idx];
            note.style.top = item.top;
            note.style.left = item.left;
            note.style.backgroundColor = item.color;
            let hexColor = '#' + item.color.slice(4,-1).split(',').map(x => (+x).toString(16).padStart(2,0)).join('');
            $(note).children("textarea").css({"background-color": item.color});
            $(note).children("textarea").val(item.text);
            $(note).children("input").val(hexColor);
            if(item.lock) $(note).children("#lock-btn").trigger("click");
            note.style.zIndex = item.zIdx;
            idx++;
        });
    }

    hotkeys("ctrl+s", (e) => {
        e.preventDefault();
        storeNotes();
    });

    hotkeys("alt+n", (e) => {
        e.preventDefault();
        notes.executeCommand(new AddNoteCommand())
    });

    $(window).on("beforeunload", (e) => {
        let changesMade = false;
        let unsavedStr = "You have unsaved changes";
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
        notesArr.push(note);
    });
    localStorage.setItem("notes", JSON.stringify(notesArr));
}

function addNote(existingNote) {
    let note = $("<div class=\"note\"></div>");
    let deleteBtn = $("<button id=\"delete-btn\">X</button>");
    let colorSelect = $("<input type=\"color\" value=\"#FFFF88\"></input>");
    let lock = $("<button id=\"lock-btn\">LOCK</button>");
    let textArea = $("<textarea></textarea>");

    let top = left = zIdx = "0";
    if(existingNote) {
        note = existingNote;
        top = note.css("top");
        left = note.css("left");
        zIdx = note.css("z-index");

        deleteBtn = existingNote.children("#delete-btn");
        colorSelect = existingNote.children("input");
        lock = existingNote.children("#lock-btn");
        textArea = existingNote.children("textarea");
    }

    note.draggable({drag: function(e, ui) {
        $(".note").each((_, obj) => {
            changeNoteVisibility(obj, false);
        });
        
        changeNoteVisibility(e.target, true);

        if(ui.position.left < 0) ui.position.left = 0;
        if(ui.position.left + $(e.target).width() > window.innerWidth) ui.position.left = window.innerWidth - 250;
        if(ui.position.top < 0) ui.position.top = 0;
        if(ui.position.top + $(e.target).height() > window.innerHeight) ui.position.top = window.innerHeight - $(e.target).height();

        sendNoteToFront(e);
    }, disabled: lock.hasClass("locked")});
    note.css({"background-color": `${colorSelect.val()}`, "width": "250px", "position": "fixed", "top": `${top}`, "left": `${left}`, "z-index": `${zIdx}`});

    deleteBtn.css({"position": "absolute", "right": "0", "margin": "-7px", "background-color": "#FF3131", "border": "2px #4A0404 solid",
                    "font-weight": "bolder", "border-radius": "50%", "visibility": "hidden", "width": "25px", "height": "25px"});
    deleteBtn.on("click", () => {
        notes.executeCommand(new DeleteNoteCommand(deleteBtn.parent()));
    });
    note.append(deleteBtn);

    colorSelect.css({"height": "50px", "width": "50px", "margin": "20px 0 5px 5px", "visibility": "hidden"});
    note.append(colorSelect);

    lock.on("click", () => {
       let dragEnabled = false;
       lock.text("UNLOCK");
       lock.addClass("locked");
       if(lock.parent().is(".ui-draggable-disabled")) {
        lock.removeClass("locked");
        dragEnabled = true;
        lock.text("LOCK");
       }
       lock.parent().draggable({disabled: !dragEnabled});
    });
    lock.css({"float": "right", "height": "50px", "margin": "20px 5px 5px 0", "visibility": "hidden"});
    note.append(lock);

    textArea.css({"width": "inherit", "padding": "0", "border": "0", "resize": "none", "background-color": `${colorSelect.val()}`,
                "min-height": "150px", "overflow-y": "hidden", "outline": "0"});
    textArea.on("input", () => {
        textArea.css({"height": "auto"});
        textArea.css({"height": textArea[0].scrollHeight + "px"});
    });
    textArea.on('touchstart', function() {
        $(this).focus();
    });
    textArea.on("focus", (e) => triggerParentNoteClick(e))
    note.append(textArea);

    colorSelect.on("change", (e) => {
        note.css({"background-color": e.target.value});
        textArea.css({"background-color": e.target.value});
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

function deleteNote(note) {
    note.remove();
}