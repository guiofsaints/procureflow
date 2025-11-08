import { useCatalog } from './catalog-provider';
import { ItemMutateDrawer } from './item-mutate-drawer';

export function CatalogDialogs() {
  const { open, setOpen, currentRow, setCurrentRow } = useCatalog();

  return (
    <>
      <ItemMutateDrawer
        key='item-create'
        open={open === 'create'}
        onOpenChange={(isOpen) => setOpen(isOpen ? 'create' : null)}
      />

      {currentRow && (
        <ItemMutateDrawer
          key={`item-update-${currentRow.id}`}
          open={open === 'update'}
          onOpenChange={(isOpen) => {
            setOpen(isOpen ? 'update' : null);
            if (!isOpen) {
              setTimeout(() => {
                setCurrentRow(null);
              }, 500);
            }
          }}
          currentRow={currentRow}
        />
      )}
    </>
  );
}
