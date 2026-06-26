import { Link } from "lucide-react";

export default function LinkCard({
    icon = <Link />,
    title,
    sub,
    items,
    emptyMessage,
    selectedId,
    onSelect,
    isItemDisabled = null,
    selectPlaceholder = "None - No linking",
    selectDisabled = false,
    error = "",
    loadingMessage = "",
    isLocked = false,
    lockedLabel = "",
    lockedSubMessage = "",
    syncedLabel = null,
}) {
    return (
        <div className="link-card">
            <div className="link-card-header">
                <div className="link-card-info">
                    <span className="preview-icon">{icon}</span>
                    <div>
                        <div className="link-card-title">{title}</div>
                        <div className="link-card-sub">{sub}</div>
                    </div>
                </div>
            </div>

            <div className="link-card-body">
                {items.length === 0 ? (
                    <p className="link-card-no-accounts">{emptyMessage}</p>
                ) : isLocked ? (
                    <div className="link-card-synced">
                        <Link /> {lockedLabel}
                        {lockedSubMessage && (
                            <p className="form-inline-muted">{lockedSubMessage}</p>
                        )}
                    </div>
                ) : (
                    <div className="form-field-gap8">
                        <select
                            value={selectedId}
                            onChange={(e) => onSelect(e.target.value)}
                            className="form-input"
                            disabled={selectDisabled}
                        >
                            <option value="">{selectPlaceholder}</option>
                            {items.map((item) => {
                                const disabled = isItemDisabled?.(item) ?? false;
                                return (
                                    <option key={item.id} value={item.id} disabled={disabled}>
                                        {item.name}{disabled ? " (already linked)" : ""}
                                    </option>
                                );
                            })}
                        </select>

                        {error && <p className="form-inline-error">{error}</p>}
                        {loadingMessage && <p className="form-inline-loading">{loadingMessage}</p>}

                        {selectedId && !error && syncedLabel && (
                            <div className="link-card-synced">
                                <Link /> {syncedLabel}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}