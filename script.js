// Note Management
class NoteManager {
    constructor() {
        this.notes = JSON.parse(localStorage.getItem('notes')) || [];
        this.currentNote = null;
        this.selectedImage = null;
        this.initializeEventListeners();
        this.renderNotes();
    }

    initializeEventListeners() {
        // Create Note Button
        const createNoteBtn = document.querySelector('.create-note-btn');
        if (createNoteBtn) {
            createNoteBtn.addEventListener('click', () => this.openNoteEditor());
        }

        // Back to Grid Button
        const backBtn = document.querySelector('.back-to-grid');
        if (backBtn) {
            backBtn.addEventListener('click', () => this.closeNoteEditor());
        }

        // Delete Note Button
        const deleteNoteBtn = document.getElementById('deleteNote');
        if (deleteNoteBtn) {
            deleteNoteBtn.addEventListener('click', () => this.showDeleteConfirmation());
        }

        // Confirmation Modal Buttons
        const cancelDeleteBtn = document.getElementById('cancelDelete');
        const confirmDeleteBtn = document.getElementById('confirmDelete');
        const closeModalBtn = document.querySelector('.close-modal');
        
        if (cancelDeleteBtn) {
            cancelDeleteBtn.addEventListener('click', () => this.hideDeleteConfirmation());
        }
        
        if (confirmDeleteBtn) {
            confirmDeleteBtn.addEventListener('click', () => this.deleteCurrentNote());
        }
        
        if (closeModalBtn) {
            closeModalBtn.addEventListener('click', () => this.hideDeleteConfirmation());
        }

        // Image Attachment
        const attachImageBtn = document.getElementById('attachImage');
        const imageInput = document.getElementById('imageInput');
        if (attachImageBtn && imageInput) {
            attachImageBtn.addEventListener('click', () => imageInput.click());
            imageInput.addEventListener('change', (e) => this.handleImageUpload(e));
        }

        // Auto-save functionality
        const noteTitle = document.querySelector('.note-title');
        const noteBody = document.querySelector('.note-body');
        
        if (noteTitle && noteBody) {
            let saveTimeout;
            const saveHandler = () => {
                clearTimeout(saveTimeout);
                saveTimeout = setTimeout(() => this.saveCurrentNote(), 500);
            };
            
            noteTitle.addEventListener('input', saveHandler);
            noteBody.addEventListener('input', saveHandler);
        }

        // Image handling
        document.addEventListener('click', (e) => {
            if (e.target.tagName === 'IMG' && e.target.parentElement.classList.contains('note-body')) {
                this.handleImageClick(e.target);
            } else if (!e.target.closest('.image-toolbar')) {
                this.deselectImage();
            }
        });

        // Image toolbar buttons
        const deleteImageBtn = document.getElementById('deleteImage');
        if (deleteImageBtn) {
            deleteImageBtn.addEventListener('click', () => this.deleteSelectedImage());
        }

        // Image resize slider
        const imageSize = document.getElementById('imageSize');
        const sizeValue = document.getElementById('sizeValue');
        if (imageSize && sizeValue) {
            imageSize.addEventListener('input', (e) => {
                if (this.selectedImage) {
                    const size = e.target.value;
                    sizeValue.textContent = `${size}%`;
                    this.selectedImage.style.width = `${size}%`;
                    this.saveCurrentNote();
                }
            });
        }
    }

    showDeleteConfirmation() {
        const modal = document.getElementById('deleteConfirmModal');
        if (modal) {
            modal.classList.add('visible');
        }
    }

    hideDeleteConfirmation() {
        const modal = document.getElementById('deleteConfirmModal');
        if (modal) {
            modal.classList.remove('visible');
        }
    }

    deleteCurrentNote() {
        if (this.currentNote) {
            // Remove the note from the array
            this.notes = this.notes.filter(note => note.id !== this.currentNote.id);
            
            // Save to localStorage
            this.saveNotes();
            
            // Hide confirmation modal
            this.hideDeleteConfirmation();
            
            // Return to grid view
            this.closeNoteEditor(true); // Pass true to skip saving
            
            // Render updated notes
            this.renderNotes();
        }
    }

    handleImageClick(img) {
        // Deselect previous image
        this.deselectImage();
        
        // Select current image
        this.selectedImage = img;
        img.classList.add('selected');
        
        // Show toolbar and position it near the image
        const toolbar = document.getElementById('imageToolbar');
        if (toolbar) {
            const rect = img.getBoundingClientRect();
            toolbar.classList.add('visible');
            
            // Position toolbar above the image
            toolbar.style.top = `${rect.top - toolbar.offsetHeight - 10}px`;
            toolbar.style.left = `${rect.left}px`;
            
            // Set slider to current image width percentage
            const slider = document.getElementById('imageSize');
            const sizeValue = document.getElementById('sizeValue');
            if (slider && sizeValue) {
                // Calculate current width as percentage of parent
                const parentWidth = img.parentElement.offsetWidth;
                const imgWidth = img.offsetWidth;
                const widthPercentage = Math.round((imgWidth / parentWidth) * 100);
                
                slider.value = widthPercentage;
                sizeValue.textContent = `${widthPercentage}%`;
            }
        }
    }

    deselectImage() {
        if (this.selectedImage) {
            this.selectedImage.classList.remove('selected');
            this.selectedImage = null;
        }
        
        // Hide toolbar
        const toolbar = document.getElementById('imageToolbar');
        if (toolbar) {
            toolbar.classList.remove('visible');
        }
    }

    deleteSelectedImage() {
        if (this.selectedImage) {
            this.selectedImage.remove();
            this.deselectImage();
            this.saveCurrentNote();
        }
    }

    openNoteEditor(noteId = null) {
        const notesGrid = document.getElementById('notesGrid');
        const noteEditor = document.getElementById('noteEditor');
        const noteTitle = noteEditor.querySelector('.note-title');
        const noteBody = noteEditor.querySelector('.note-body');

        notesGrid.style.display = 'none';
        noteEditor.style.display = 'flex';

        if (noteId) {
            this.currentNote = this.notes.find(note => note.id === noteId);
            if (this.currentNote) {
                noteTitle.innerHTML = this.currentNote.title || '';
                noteBody.innerHTML = this.currentNote.content || '';
            }
        } else {
            this.currentNote = {
                id: Date.now().toString(),
                title: '',
                content: '',
                createdAt: new Date().toISOString()
            };
            noteTitle.innerHTML = '';
            noteBody.innerHTML = '';
        }

        noteTitle.focus();
    }

    closeNoteEditor(skipSave = false) {
        const notesGrid = document.getElementById('notesGrid');
        const noteEditor = document.getElementById('noteEditor');

        if (!skipSave) {
            this.saveCurrentNote();
        }
        
        this.deselectImage();
        
        notesGrid.style.display = 'grid';
        noteEditor.style.display = 'none';
        this.currentNote = null;
    }

    saveCurrentNote() {
        if (this.currentNote) {
            const noteTitle = document.querySelector('.note-title');
            const noteBody = document.querySelector('.note-body');
            
            this.currentNote.title = noteTitle.innerHTML.trim() || 'Untitled Note';
            this.currentNote.content = noteBody.innerHTML;
            this.currentNote.updatedAt = new Date().toISOString();

            const existingNoteIndex = this.notes.findIndex(note => note.id === this.currentNote.id);
            if (existingNoteIndex === -1) {
                this.notes.push(this.currentNote);
            } else {
                this.notes[existingNoteIndex] = this.currentNote;
            }

            this.saveNotes();
            this.renderNotes();
        }
    }

    handleImageUpload(event) {
        const file = event.target.files[0];
        if (file && file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = document.createElement('img');
                img.src = e.target.result;
                img.style.width = '100%'; // Default to 100% width
                document.querySelector('.note-body').appendChild(img);
                this.handleImageClick(img);
                this.saveCurrentNote();
            };
            reader.readAsDataURL(file);
        }
    }

    renderNotes() {
        const notesGrid = document.querySelector('.notes-grid');
        const noteItems = document.querySelector('.note-items');
        
        if (notesGrid) {
            notesGrid.innerHTML = '';
            
            if (this.notes.length === 0) {
                notesGrid.innerHTML = `
                    <div class="empty-state">
                        <i class="fas fa-sticky-note"></i>
                        <h3>No Notes Yet</h3>
                        <p>Click the "Create New Note" button to get started.</p>
                    </div>
                `;
            } else {
                this.notes.forEach(note => {
                    const noteCard = this.createNoteCard(note);
                    notesGrid.appendChild(noteCard);
                });
            }
        }

        if (noteItems) {
            noteItems.innerHTML = '';
            this.notes.forEach(note => {
                const noteItem = this.createNoteItem(note);
                noteItems.appendChild(noteItem);
            });
        }
    }

    createNoteCard(note) {
        const card = document.createElement('div');
        card.className = 'note-card';
        const content = note.content.replace(/<[^>]*>/g, '');
        card.innerHTML = `
            <h3>${note.title || 'Untitled Note'}</h3>
            <p>${content.substring(0, 200)}${content.length > 200 ? '...' : ''}</p>
            <small>Last updated: ${new Date(note.updatedAt || note.createdAt).toLocaleDateString()}</small>
        `;
        card.addEventListener('click', () => this.openNoteEditor(note.id));
        return card;
    }

    createNoteItem(note) {
        const item = document.createElement('div');
        item.className = 'note-item';
        item.innerHTML = `
            <span>${note.title || 'Untitled Note'}</span>
            <small>${new Date(note.updatedAt || note.createdAt).toLocaleDateString()}</small>
        `;
        item.addEventListener('click', () => this.openNoteEditor(note.id));
        return item;
    }

    saveNotes() {
        localStorage.setItem('notes', JSON.stringify(this.notes));
    }

    
}

/**
 * Theme Management
 */
function applyTheme(theme) {
    document.body.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
}



function initTheme() {
    // Check if theme is stored in localStorage
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
        applyTheme(savedTheme);
    } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        // If no saved theme, use system preference if available
        applyTheme('dark');
    } else {
        // Default to light theme
        applyTheme('light');
    }
}

// Ensure that theme is initialized immediately for all pages
initTheme();

// Initialize the app
document.addEventListener('DOMContentLoaded', function() {
    // Re-apply theme after DOM is ready
    initTheme();
    
    // Add event listeners for theme switch if on settings page
    const lightThemeBtn = document.getElementById('lightTheme');
    const darkThemeBtn = document.getElementById('darkTheme');
    
    if (lightThemeBtn && darkThemeBtn) {
        // Check current theme
        const currentTheme = localStorage.getItem('theme') || 'light';
        if (currentTheme === 'light') {
            lightThemeBtn.checked = true;
        } else {
            darkThemeBtn.checked = true;
        }
        
        // Add event listeners
        lightThemeBtn.addEventListener('change', function() {
            if (this.checked) {
                applyTheme('light');
            }
        });
        
        darkThemeBtn.addEventListener('change', function() {
            if (this.checked) {
                applyTheme('dark');
            }
        });
    }
    
    // Check if we're on the dashboard page
    if (document.querySelector('.dashboard-container')) {
        initDashboard();
    }
});

// Function to initialize dashboard functionality
function initDashboard() {
    const noteManager = new NoteManager();
} 


function updateTime() {
    const now = new Date();
    const hours = now.getHours();
    const minutes = now.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    
    // Format hours to 12-hour format
    const formattedHours = hours % 12 || 12; // Convert 0 to 12
    const formattedMinutes = String(minutes).padStart(2, '0'); // Add leading zero if needed

    // Update the time and day in the HTML
    document.getElementById('current-time').textContent = `${formattedHours}:${formattedMinutes}`;
    document.getElementById('time-sub-text').textContent = ampm;
    document.getElementById('current-day').textContent = now.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
}

// Update time every second
setInterval(updateTime, 1000);
updateTime(); // Initial call to set the time immediately