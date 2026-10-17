import { DndContext, closestCenter } from "@dnd-kit/core";
import { SortableContext, rectSortingStrategy } from "@dnd-kit/sortable";
import styles from "./Admin.module.css";
import AdminMediaChip from "./AdminMediaChip";
import Input from "../form/Input";
import Checkbox from "../form/Checkbox";
import Textarea from "../form/Textarea";
import {
  BaseResourceForm,
  ResourceDetailsBase,
  ResourceEditConfig,
} from "../../types/resourceEditForm";
import { useResourceEditForm } from "../../hooks/useResourceEditForm";

interface ResourceEditFormProps<
  TDetails extends ResourceDetailsBase,
  TForm extends BaseResourceForm,
> {
  resourceId: string | null;
  onClose: () => void;
  config: ResourceEditConfig<TDetails, TForm>;
}

export default function ResourceEditForm<
  TDetails extends ResourceDetailsBase,
  TForm extends BaseResourceForm,
>({ resourceId, onClose, config }: ResourceEditFormProps<TDetails, TForm>) {
  const {
    resource,
    isLoadingResource,
    isErrorResource,
    form,
    setField,
    setBool,
    mediaItems,
    markedMediaUids,
    toggleMarkMedia,
    handleDragEnd,
    sensors,
    thumbRef,
    mediaRef,
    newThumb,
    setNewThumb,
    deleteThumbnail,
    setDeleteThumbnail,
    handleThumbPick,
    handleAddMediaFiles,
    thumbnailSrc,
    showThumbnailDelete,
    newCount,
    saving,
    msg,
    fieldErrors,
    handleSave,
  } = useResourceEditForm<TDetails, TForm>(resourceId, config, onClose);

  const { copy } = config;

  if (resourceId && isLoadingResource) {
    return (
      <div className={styles.editForm}>
        <h3>{copy.loadingTitle}</h3>
        <p className="text-muted">{copy.loadingBody}</p>
      </div>
    );
  }

  if (resourceId && isErrorResource) {
    return (
      <div className={styles.editForm}>
        <h3>{copy.errorTitle}</h3>
        <p className="msg-error">{copy.errorBody}</p>
        <div className={styles.editActions}>
          <button className="btn btn-ghost" onClick={onClose}>
            {copy.closeButton}
          </button>
        </div>
      </div>
    );
  }

  return (
    <form
      className={styles.editForm}
      onSubmit={(e) => {
        e.preventDefault();
        handleSave();
      }}
    >
      <h3>
        {resourceId
          ? `${copy.editTitlePrefix}${resource?.name ?? ""}`
          : copy.newTitle}
      </h3>

      <div className={styles.editGridBase}>
        <div className={styles.editThumbCol}>
          <div
            className={`${styles.thumbPreview} ${
              deleteThumbnail ? styles.thumbPreviewDeleted : ""
            }`}
            onClick={() => !deleteThumbnail && thumbRef.current?.click()}
            title={deleteThumbnail ? "" : "Cliquer pour changer la miniature"}
          >
            {thumbnailSrc && !deleteThumbnail ? (
              <img
                src={newThumb ? thumbnailSrc : `/api/${thumbnailSrc}`}
                alt={resource?.name ?? ""}
                className={styles.thumbPreviewImg}
              />
            ) : (
              <div className={styles.thumbPreviewEmpty}>
                <span>{deleteThumbnail ? "Supprimée" : "Miniature"}</span>
                {!deleteThumbnail && (
                  <span className={styles.thumbHint}>Cliquer pour ajouter</span>
                )}
              </div>
            )}

            {showThumbnailDelete && (
              <button
                type="button"
                className={styles.thumbRemoveBtn}
                onClick={(e) => {
                  e.stopPropagation();
                  setDeleteThumbnail(true);
                  setNewThumb(null);
                }}
                title="Supprimer la miniature"
              >
                ✕
              </button>
            )}

            {deleteThumbnail && (
              <button
                type="button"
                className={styles.thumbUndoBtn}
                onClick={(e) => {
                  e.stopPropagation();
                  setDeleteThumbnail(false);
                }}
              >
                Annuler
              </button>
            )}
          </div>
          <input
            ref={thumbRef}
            type="file"
            accept="image/*"
            style={{ display: "none" }}
            onChange={(e) =>
              e.target.files?.[0] && handleThumbPick(e.target.files[0])
            }
          />
          <p className={styles.thumbCaption}>JPG, PNG, WEBP · Max 10 Mo</p>
        </div>

        <div className={styles.editFieldsColBase}>
          <Input
            label={copy.nameLabel}
            value={form.name}
            onChange={setField("name")}
            placeholder={copy.namePlaceholder}
            error={fieldErrors.name}
            required
          />
          <Textarea
            label="Description"
            value={form.description}
            onChange={setField("description")}
            placeholder={copy.descriptionPlaceholder}
            error={fieldErrors.description}
            required
          />
        </div>
      </div>

      <div className={styles.editSection}>
        <h4>Caractéristiques</h4>
        <div className={styles.fieldsRow}>
          <Input
            label="Type"
            value={form.type}
            onChange={setField("type")}
            placeholder="T2, Studio…"
            error={fieldErrors.type}
            required
          />
          <Input
            label="Étage"
            value={form.floor}
            onChange={setField("floor")}
            placeholder="2e"
            error={fieldErrors.floor}
            required
          />
          <Input
            label="Surface Carrez (m²)"
            type="number"
            value={form.sizeCarrezSqm}
            onChange={setField("sizeCarrezSqm")}
            placeholder="65"
            error={fieldErrors.sizeCarrezSqm}
            required
          />
          <Input
            label="Surface au sol (m²)"
            type="number"
            value={form.sizeFloorSqm}
            onChange={setField("sizeFloorSqm")}
            placeholder="68"
            error={fieldErrors.sizeFloorSqm}
            required
          />
          <Input
            label="Orientation"
            value={form.orientation}
            onChange={setField("orientation")}
            placeholder="Sud, Est…"
            error={fieldErrors.orientation}
            required
          />
          <Input
            label="Vue"
            value={form.view}
            onChange={setField("view")}
            placeholder="Cour, rue…"
            error={fieldErrors.view}
            required
          />
        </div>
        <Checkbox
          label="Extérieur privé"
          checked={form.hasPrivateExterior}
          onChange={setBool("hasPrivateExterior")}
        />
      </div>

      <div className={styles.editSection}>
        <h4>Chauffage & Eau chaude</h4>
        <div className={styles.fieldsRow}>
          <Input
            label="Chauffage électrique"
            value={form.electricHeatingModel}
            onChange={setField("electricHeatingModel")}
            placeholder="Modèle…"
            error={fieldErrors.electricHeatingModel}
            required
          />
          <Input
            label="Sèche-serviette"
            value={form.bathroomTowelHeaterModel}
            onChange={setField("bathroomTowelHeaterModel")}
            placeholder="Modèle…"
            error={fieldErrors.bathroomTowelHeaterModel}
            required
          />
          <Input
            label="Chauffe-eau électrique"
            value={form.electricWaterHeaterModel}
            onChange={setField("electricWaterHeaterModel")}
            placeholder="Modèle…"
            error={fieldErrors.electricWaterHeaterModel}
            required
          />
        </div>
      </div>

      {config.kitchenFields.length > 0 && (
        <div className={styles.editSection}>
          <h4>Cuisine</h4>
          <div className={styles.fieldsRow}>
            {config.kitchenFields.map((field) => (
              <Input
                key={field.key}
                label={field.label}
                value={form[field.key] as string}
                onChange={setField(field.key)}
                placeholder={field.placeholder ?? "Modèle…"}
                error={fieldErrors[field.key as string]}
                required
              />
            ))}
          </div>
        </div>
      )}

      <div className={styles.editSection}>
        <h4>Performance énergétique (DPE)</h4>
        <div className={styles.fieldsRow}>
          <Input
            label="Classe énergie"
            value={form.dpeEnergyRating}
            onChange={setField("dpeEnergyRating")}
            placeholder="A, B, C…"
            error={fieldErrors.dpeEnergyRating}
            required
          />
          <Input
            label="Consommation (kWh/m²/an)"
            type="number"
            value={form.dpeEnergyKwhPerSqmYear}
            onChange={setField("dpeEnergyKwhPerSqmYear")}
            placeholder="120"
            error={fieldErrors.dpeEnergyKwhPerSqmYear}
            required
          />
          <Input
            label="Classe émissions"
            value={form.dpeEmissionsRating}
            onChange={setField("dpeEmissionsRating")}
            placeholder="A, B, C…"
            error={fieldErrors.dpeEmissionsRating}
            required
          />
          <Input
            label="Émissions GES (kg/m²/an)"
            type="number"
            value={form.dpeEmissionsKgPerSqmYear}
            onChange={setField("dpeEmissionsKgPerSqmYear")}
            placeholder="25"
            error={fieldErrors.dpeEmissionsKgPerSqmYear}
            required
          />
          <Input
            label="Conso. locataire préc. (€/an)"
            type="number"
            value={form.previousTenantAnnualConsumptionEur}
            onChange={setField("previousTenantAnnualConsumptionEur")}
            placeholder="1200"
            error={fieldErrors.previousTenantAnnualConsumptionEur}
            required
          />
          <Input
            label="Puissance compteur (kVA)"
            type="number"
            value={form.meterPowerKva}
            onChange={setField("meterPowerKva")}
            placeholder="6"
            error={fieldErrors.meterPowerKva}
            required
          />
          <Input
            label="Point de livraison (PDL)"
            value={form.deliveryPointId}
            onChange={setField("deliveryPointId")}
            placeholder="14 chiffres"
            error={fieldErrors.deliveryPointId}
            required
          />
        </div>
        <Checkbox
          label="Double vitrage"
          checked={form.hasDoubleGlazedWindows}
          onChange={setBool("hasDoubleGlazedWindows")}
        />
      </div>

      <div className={styles.editSection}>
        <h4>Connectivité</h4>
        <div style={{ display: "flex", gap: 24, marginBottom: 8 }}>
          <Checkbox
            label="Fibre optique"
            checked={form.hasFiberOptic}
            onChange={setBool("hasFiberOptic")}
          />
          <Checkbox
            label="Réseau cuivre"
            checked={form.hasCopperNetwork}
            onChange={setBool("hasCopperNetwork")}
          />
          <Checkbox
            label="Prise TV"
            checked={form.hasTvOutlet}
            onChange={setBool("hasTvOutlet")}
          />
        </div>
      </div>

      <div className={styles.editSection}>
        <h4>Cadastre</h4>
        <div className={styles.fieldsRow}>
          <Input
            label="Référence avant 2025"
            value={form.landRegistryRefPre2025}
            onChange={setField("landRegistryRefPre2025")}
            placeholder="Référence cadastrale…"
            error={fieldErrors.landRegistryRefPre2025}
            required
          />
          <Input
            label="Référence après 2025"
            value={form.landRegistryRefPost2025}
            onChange={setField("landRegistryRefPost2025")}
            placeholder="Référence cadastrale…"
            error={fieldErrors.landRegistryRefPost2025}
            required
          />
        </div>
      </div>

      {resourceId && (
        <div className={styles.mediaSection}>
          <h4>
            Médias
            {mediaItems.length === 0 && (
              <span className={styles.noMedia}> · {copy.noMediaText}</span>
            )}
            {newCount > 0 && (
              <span className={styles.addedCount}>
                {" "}
                · {newCount} fichier{newCount > 1 ? "s" : ""} sélectionné
                {newCount > 1 ? "s" : ""}
              </span>
            )}
            {markedMediaUids.size > 0 && (
              <span className={styles.deleteCount}>
                {" "}
                · {markedMediaUids.size} marqué
                {markedMediaUids.size > 1 ? "s" : ""} pour suppression
              </span>
            )}
          </h4>

          <div className={styles.mediaChipGrid}>
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={mediaItems.map((m) => m.uid)}
                strategy={rectSortingStrategy}
              >
                {mediaItems.map((item, idx) => (
                  <AdminMediaChip
                    key={item.uid}
                    item={item}
                    index={idx}
                    marked={markedMediaUids.has(item.uid)}
                    onToggle={() => toggleMarkMedia(item.uid)}
                  />
                ))}
              </SortableContext>
            </DndContext>
            <button
              type="button"
              className={styles.mediaChipAdd}
              onClick={() => mediaRef.current?.click()}
            >
              <span className={styles.mediaChipAddIcon}>+</span>
              <span className={styles.mediaChipAddLabel}>Ajouter</span>
              <input
                ref={mediaRef}
                type="file"
                multiple
                accept="image/*,video/*"
                style={{ display: "none" }}
                onChange={(e) => {
                  const files = Array.from(e.target.files ?? []);
                  handleAddMediaFiles(files);
                  e.target.value = "";
                }}
              />
            </button>
          </div>
        </div>
      )}

      {msg && (
        <p className={msg.type === "error" ? "msg-error" : "msg-success"}>
          {msg.text}
        </p>
      )}

      <div className={styles.editActions}>
        <button className="btn btn-primary" disabled={saving} type="submit">
          {saving ? "Enregistrement…" : "Enregistrer"}
        </button>
        <button className="btn btn-ghost" onClick={onClose} type="button">
          {copy.closeButton}
        </button>
      </div>
    </form>
  );
}
