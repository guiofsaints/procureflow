import { useCatalog } from './catalog-provider';
import { ItemMutateDialog } from './item-mutate-dialog';

export function CatalogDialogs() {
  const { open, setOpen, currentRow, setCurrentRow, onRefreshCatalog } =
    useCatalog();

  return (
    <>
      <ItemMutateDialog
        key='item-create'
        open={open === 'create'}
        onOpenChange={(isOpen) => setOpen(isOpen ? 'create' : null)}
        onSuccess={onRefreshCatalog}
      />

      {currentRow && (
        <ItemMutateDialog
          key={`item-update-${currentRow.id}`}
          open={open === 'update'}
          onOpenChange={(isOpen) => {
            setOpen(isOpen ? 'update' : null);
            if (!isOpen) {
              setTimeout(() => {
                setCurrentRow(null);
              }, 300);
            }
          }}
          currentRow={currentRow}
          onSuccess={onRefreshCatalog}
        />
      )}
    </>
  );
}
