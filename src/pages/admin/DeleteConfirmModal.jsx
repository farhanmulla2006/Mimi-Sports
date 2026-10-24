function DeleteConfirmModal({ productName, onCancel, onConfirm }) {
  return (
    <div className="admin-modal-backdrop" onClick={onCancel}>
      <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
        <h3>Delete this product?</h3>
        <p>
          Are you sure you want to delete <strong>{productName}</strong>? This can't be undone from the admin panel.
        </p>
        <div className="admin-modal__actions">
          <button className="admin-btn admin-btn-outline" onClick={onCancel}>Cancel</button>
          <button
            className="admin-btn"
            style={{ background: 'var(--color-error)', color: '#fff' }}
            onClick={onConfirm}
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  )
}

export default DeleteConfirmModal
