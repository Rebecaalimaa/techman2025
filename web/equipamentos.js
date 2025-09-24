const API_BASE_URL = 'http://localhost:3000';
let currentUser  = null;
let equipmentToDelete = null;
let currentEquipmentForComments = null;

function checkAuth() {
    const user = localStorage.getItem('user');
    if (!user) {
        window.location.href = 'index.html';
        return false;
    }
    currentUser  = JSON.parse(user);
    document.getElementById('userInfo').textContent = `${currentUser .perfil.nome} - ID: ${currentUser .id}`;
    if (currentUser .perfilId === 2) {
        document.getElementById('newEquipmentBtn').style.display = 'inline-flex';
    }
    return true;
}

async function loadEquipments() {
    try {
        const response = await fetch(`${API_BASE_URL}/equipamentos`);
        if (!response.ok) throw new Error('Erro ao buscar equipamentos');
        const equipments = await response.json();
        document.getElementById('loadingEquipments').style.display = 'none';
        if (!equipments || equipments.length === 0) {
            document.getElementById('noEquipment').style.display = 'block';
            return;
        }
        const grid = document.getElementById('equipmentGrid');
        grid.innerHTML = '';
        equipments.forEach(equipment => {
            equipment.criadoEm = equipment.criado_em;
            equipment.id = equipment.equipamento_id || equipment.id;
            grid.appendChild(createEquipmentCard(equipment));
        });
        grid.style.display = 'grid';
    } catch (error) {
        console.error('Erro ao carregar equipamentos:', error);
        document.getElementById('loadingEquipments').innerHTML = '<div style="color: #ff6b6b;">Erro ao carregar equipamentos</div>';
    }
}

function createEquipmentCard(equipment) {
    const card = document.createElement('div');
    card.className = 'equipment-card';
    card.innerHTML = `
        <img src="${equipment.imagem}" alt="${equipment.nome}" class="equipment-image" 
            onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgdmlld0JveD0iMCAwIDEwMCAxMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIiBmaWxsPSIjZjBmMGYwIi8+Cjx0ZXh0IHg9IjUwIiB5PSI1NSIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjEyIiBmaWxsPSIjOTk5IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj5JbWFnZW08L3RleHQ+Cjwvc3ZnPg=='">
        <div class="equipment-title">${equipment.nome}</div>
        <div class="equipment-description">${equipment.descricao}</div>
        <div class="equipment-actions">
            <div class="icon-btn comment" onclick="openCommentsModal(${equipment.id})" title="Comentários">
                💬
            </div>
            ${currentUser  && currentUser .perfilId === 2 ? `
                <div class="icon-btn delete" onclick="openDeleteModal(${equipment.id})" title="Excluir equipamento">
                    🗑️
                </div>
            ` : ''}
        </div>
    `;
    return card;
}

function openCommentsModal(equipmentId) {
    currentEquipmentForComments = equipmentId;
    document.getElementById('commentsModal').style.display = 'block';
    loadComments();
}

function closeCommentsModal() {
    currentEquipmentForComments = null;
    document.getElementById('commentsModal').style.display = 'none';
    document.getElementById('commentsContent').innerHTML = '';
}

async function loadComments() {
    if (!currentEquipmentForComments) return;
    try {
        const response = await fetch(`${API_BASE_URL}/equipamentos/${currentEquipmentForComments}/comentarios`);
        if (!response.ok) throw new Error('Erro ao buscar comentários');
        const comments = await response.json();
        const content = document.getElementById('commentsContent');
        let html = `
            <div class="add-comment-form" style="margin-bottom: 20px;">
                <textarea id="newCommentText" placeholder="Adicione um comentário..." style="width: 100%; padding: 10px; border-radius: 5px; min-height: 80px; resize: vertical;"></textarea>
                <button class="btn" onclick="addComment()" style="margin-top: 10px; background: #44babc; color: white;">Enviar Comentário</button>
            </div>
        `;
        if (comments && comments.length > 0) {
            html += '<div class="comments-list" style="max-height: 400px; overflow-y: auto;">';
            comments.forEach(comment => {
                const commentDate = new Date(comment.data || comment.criado_em).toLocaleString('pt-BR');
                html += `
                    <div class="comment-item" style="margin-bottom: 15px; padding: 10px; border: 1px solid #ddd; border-radius: 5px; background: #f9f9f9;">
                        <div style="font-weight: bold; color: #333; margin-bottom: 5px;">
                            ${comment.usuarioNome || comment.usuario_nome || 'Usuário Anônimo'} - ${commentDate}
                        </div>
                        <p style="margin: 0; color: #555;">${comment.texto || comment.comentario}</p>
                    </div>
                `;
            });
            html += '</div>';
        } else {
            html += '<p style="text-align: center; color: #999; margin-top: 20px;">Nenhum comentário cadastrado ainda. Seja o primeiro!</p>';
        }
        content.innerHTML = html;
    } catch (error) {
        console.error('Erro ao carregar comentários:', error);
        document.getElementById('commentsContent').innerHTML = '<p style="color: #ff6b6b;">Erro ao carregar comentários. Tente novamente.</p>';
    }
}

async function addComment() {
    const text = document.getElementById('newCommentText').value.trim();
    if (!text || !currentEquipmentForComments || !currentUser ) return alert('Comentário vazio ou erro de autenticação.');
    try {
        const formData = {
            texto: text,
            usuarioId: currentUser .id,
            usuarioNome: currentUser .perfil.nome, // Opcional, para facilitar no backend
            equipamentoId: currentEquipmentForComments
        };
        const response = await fetch(`${API_BASE_URL}/equipamentos/${currentEquipmentForComments}/comentarios`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData),
        });
        if (response.ok) {
            document.getElementById('newCommentText').value = '';
            loadComments(); // Recarrega a lista para mostrar o novo comentário
        } else {
            alert('Erro ao adicionar comentário. Verifique se você está logado.');
        }
    } catch (error) {
        console.error('Erro ao adicionar comentário:', error);
        alert('Erro ao adicionar comentário. Tente novamente.');
    }
}

function openDeleteModal(equipmentId) {
    equipmentToDelete = equipmentId;
    document.getElementById('deleteModal').style.display = 'block';
}

function closeDeleteModal() {
    equipmentToDelete = null;
    document.getElementById('deleteModal').style.display = 'none';
}

async function confirmDelete() {
    if (!equipmentToDelete) return;
    try {
        const response = await fetch(`${API_BASE_URL}/equipamentos/${equipmentToDelete}`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ perfilId: currentUser .perfilId }),
        });
        if (response.ok) {
            closeDeleteModal();
            loadEquipments();
        } else {
            alert('Erro ao excluir equipamento.');
        }
    } catch (error) {
        console.error('Erro ao excluir equipamento:', error);
        alert('Erro ao excluir equipamento.');
    }
}

function openNewEquipmentModal() {
    document.getElementById('newEquipmentModal').style.display = 'block';
}

function closeNewEquipmentModal() {
    document.getElementById('newEquipmentModal').style.display = 'none';
    document.getElementById('newEquipmentForm').reset();
}

document.getElementById('newEquipmentForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    const formData = {
        nome: document.getElementById('equipmentName').value,
        imagem: document.getElementById('equipmentImage').value,
        descricao: document.getElementById('equipmentDescription').value,
        ativo: document.getElementById('equipmentActive').checked,
        perfilId: currentUser .perfilId,
    };
    try {
        const response = await fetch(`${API_BASE_URL}/equipamentos`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData),
        });
        if (response.ok) {
            closeNewEquipmentModal();
            loadEquipments();
        } else {
            alert('Erro ao cadastrar equipamento.');
        }
    } catch (error) {
        console.error('Erro ao cadastrar equipamento:', error);
        alert('Erro ao cadastrar equipamento.');
    }
});

function logout() {
    localStorage.removeItem('user');
    window.location.href = 'index.html';
}

document.addEventListener('DOMContentLoaded', () => {
    if (checkAuth()) loadEquipments();
});