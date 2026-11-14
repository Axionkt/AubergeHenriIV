import { useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "../../lib/axios";
import { keys } from "../../lib/query";
import { getApiErrorMessage } from "../../lib/apiError";
import ConfirmModal from "../ConfirmModal";
import styles from "./Admin.module.css";
import { ProSpaceItemAdmin, ProSpaceDetailsAdmin } from "../../types/proSpace";
import Switch from "../form/Switch";
import ResourceEditForm from "./ResourceEditForm";
import {
  BaseResourceForm,
  KitchenFieldConfig,
  ResourceEditConfig,
} from "../../types/resourceEditForm";
import {
  toNumberOrNull,
  toNumberOrUndefined,
  toStringOrNull,
} from "../../lib/dataFormatting";

interface SpaceForm extends BaseResourceForm {
  kitchenCabinetsModel: string;
}

const EMPTY_SPACE: SpaceForm = {
  name: "",
  description: "",
  type: "",
  sizeCarrezSqm: "",
  sizeFloorSqm: "",
  floor: "",
  orientation: "",
  view: "",
  hasPrivateExterior: false,
  hasPrivateParking: false,
  electricHeatingModel: "",
  bathroomTowelHeaterModel: "",
  electricWaterHeaterModel: "",
  kitchenCabinetsModel: "",
  dpeEnergyRating: "",
  dpeEnergyKwhPerSqmYear: "",
  dpeEmissionsRating: "",
  dpeEmissionsKgPerSqmYear: "",
  previousTenantAnnualConsumptionEur: "",
  hasDoubleGlazedWindows: false,
  meterPowerKva: "",
  deliveryPointId: "",
  hasFiberOptic: false,
  hasCopperNetwork: false,
  hasTvOutlet: false,
  landRegistryRefPre2025: "",
  landRegistryRefPost2025: "",
};

function spaceToForm(apt: ProSpaceDetailsAdmin): SpaceForm {
  const form = { ...EMPTY_SPACE } as Record<string, string | boolean>;

  for (const key of Object.keys(EMPTY_SPACE) as (keyof SpaceForm)[]) {
    const value = apt[key];
    form[key] =
      typeof EMPTY_SPACE[key] === "boolean"
        ? Boolean(value)
        : String(value ?? "");
  }

  return form as unknown as SpaceForm;
}

function formToPayload(form: SpaceForm): Record<string, unknown> {
  return {
    name: form.name,
    description: form.description,
    type: form.type,
    sizeCarrezSqm: toNumberOrUndefined(form.sizeCarrezSqm),
    sizeFloorSqm: toNumberOrUndefined(form.sizeFloorSqm),
    floor: form.floor,
    orientation: form.orientation,
    view: form.view,
    hasPrivateExterior: form.hasPrivateExterior,
    hasPrivateParking: form.hasPrivateParking,
    electricHeatingModel: form.electricHeatingModel,
    bathroomTowelHeaterModel: form.bathroomTowelHeaterModel,
    electricWaterHeaterModel: form.electricWaterHeaterModel,
    kitchenCabinetsModel: form.kitchenCabinetsModel,
    dpeEnergyRating: toStringOrNull(form.dpeEnergyRating),
    dpeEnergyKwhPerSqmYear: toNumberOrNull(form.dpeEnergyKwhPerSqmYear),
    dpeEmissionsRating: toStringOrNull(form.dpeEmissionsRating),
    dpeEmissionsKgPerSqmYear: toNumberOrNull(form.dpeEmissionsKgPerSqmYear),
    previousTenantAnnualConsumptionEur: toStringOrNull(
      form.previousTenantAnnualConsumptionEur,
    ),
    hasDoubleGlazedWindows: form.hasDoubleGlazedWindows,
    meterPowerKva: toNumberOrUndefined(form.meterPowerKva),
    deliveryPointId: form.deliveryPointId,
    hasFiberOptic: form.hasFiberOptic,
    hasCopperNetwork: form.hasCopperNetwork,
    hasTvOutlet: form.hasTvOutlet,
    landRegistryRefPre2025: form.landRegistryRefPre2025,
    landRegistryRefPost2025: form.landRegistryRefPost2025,
  };
}

const kitchenFields: KitchenFieldConfig<SpaceForm>[] = [
  { key: "kitchenCabinetsModel", label: "Meubles de cuisine" },
];

const proSpaceEditConfig: ResourceEditConfig<ProSpaceDetailsAdmin, SpaceForm> =
  {
    copy: {
      loadingTitle: "Chargement…",
      loadingBody: "Récupération des détails de l'espace pro…",
      errorTitle: "Erreur",
      errorBody: "Impossible de charger les détails de cet espace pro.",
      newTitle: "Nouvel espace pro",
      editTitlePrefix: "Modifier — ",
      nameLabel: "Nom de l'espace pro",
      namePlaceholder: "Espace Pro 4B",
      descriptionPlaceholder: "Décrivez l'espace pro…",
      noMediaText: "Aucun média pour cet espace pro",
      requiredNameError: "Le nom est requis.",
      createSuccess: "Espace pro créé.",
      updateSuccess: "Modifications enregistrées.",
      genericError: "Une erreur est survenue.",
      closeButton: "Fermer",
      createSuccessThumbnailFailed:
        "Espace pro créé. La miniature n'a cependant pas pu être envoyée — vous pouvez réessayer en modifiant la fiche.",
    },
    api: {
      detailUrl: (id) => `/admin/pro-spaces/${id}`,
      createUrl: "/admin/pro-spaces",
      mediaListUrl: (id) => `/admin/pro-spaces/${id}/media`,
      mediaThumbnailUrl: (id) => `/admin/media/pro-space/${id}/thumbnail`,
      mediaPlanUrl: (id) => `/admin/media/pro-space/${id}/plan`,
      mediaBulkUrl: (id) => `/admin/media/pro-space/${id}`,
      mediaReorderUrl: (id) => `/admin/media/pro-space/${id}/reorder`,
    },
    queryKeys: {
      detail: (id) => keys.proSpaceAdmin(id),
      media: (id) => keys.proSpaceMediaAdmin(id),
      invalidateOnSave: keys.proSpaces(),
    },
    emptyForm: EMPTY_SPACE,
    toForm: spaceToForm,
    toPayload: formToPayload,
    kitchenFields,
  };

export default function ProSpacesPanel() {
  const [editTargetId, setEditTargetId] = useState<string | "new" | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [availabilityTarget, setAvailabilityTarget] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [availabilityError, setAvailabilityError] = useState<string | null>(
    null,
  );
  const qc = useQueryClient();

  const {
    data: proSpaces = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey: keys.proSpacesAdmin(),
    queryFn: () =>
      api.get<ProSpaceItemAdmin[]>("/admin/pro-spaces").then((r) => r.data),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => api.delete(`/admin/pro-spaces/${id}`),
    onMutate: (id) => {
      return { deletedId: id };
    },
    onSuccess: (_, __, context) => {
      qc.invalidateQueries({ queryKey: keys.proSpaces() });
      if (context.deletedId === editTargetId) setEditTargetId(null);
      setDeleteError(null);
    },
    onError: (err) =>
      setDeleteError(
        getApiErrorMessage(err, "Impossible de supprimer l'espace pro."),
      ),
  });

  const availabilityMut = useMutation({
    mutationFn: ({
      id,
      isAvailable,
      revokeAccesses,
    }: {
      id: string;
      isAvailable: boolean;
      revokeAccesses: boolean;
    }) =>
      api.put(`/admin/pro-spaces/${id}/availability`, {
        isAvailable,
        revokeAccesses,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.proSpaces() });
      qc.invalidateQueries({ queryKey: keys.userProSpaceAccesses() });
      setAvailabilityError(null);
    },
    onError: (err) =>
      setAvailabilityError(
        getApiErrorMessage(
          err,
          "Impossible de mettre à jour la disponibilité.",
        ),
      ),
  });

  return (
    <>
      <div className={styles.panelHead}>
        <div>
          <p className="section-eyebrow">Administration</p>
          <h2>Espaces pro</h2>
        </div>
        <button
          className="btn btn-primary btn-sm"
          onClick={() => setEditTargetId("new")}
        >
          + Nouvel espace pro
        </button>
      </div>

      {isError && (
        <p className="msg-error" style={{ marginBottom: 16 }}>
          Impossible de charger les espaces pro.
        </p>
      )}

      {deleteError && (
        <p className="msg-error" style={{ marginBottom: 16 }}>
          {deleteError}
        </p>
      )}

      {availabilityError && (
        <p className="msg-error" style={{ marginBottom: 16 }}>
          {availabilityError}
        </p>
      )}

      <div className="card" style={{ overflow: "hidden" }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>Espace pro</th>
              <th>Disponibilité</th>
              <th>Médias</th>
              <th>Nombre d'accès</th>
              <th className={styles.actionsCol}></th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <tr key={i}>
                  <td>
                    <div className={styles.tableCell}>
                      <div className={styles.tableThumb}>
                        <div
                          className="skeleton"
                          style={{ width: "100%", height: "100%" }}
                        />
                      </div>
                      <div
                        className="skeleton"
                        style={{ height: 16, width: 140 }}
                      />
                    </div>
                  </td>
                  <td>
                    <div
                      className="skeleton"
                      style={{ height: 14, width: 60 }}
                    />
                  </td>
                  <td>
                    <div
                      className="skeleton"
                      style={{ height: 14, width: 56 }}
                    />
                  </td>
                  <td>
                    <div
                      className="skeleton"
                      style={{ height: 14, width: 24 }}
                    />
                  </td>
                  <td>
                    <div
                      style={{
                        display: "flex",
                        gap: 6,
                        justifyContent: "flex-end",
                      }}
                    >
                      <div
                        className="skeleton"
                        style={{ height: 30, width: 48, borderRadius: 6 }}
                      />
                      <div
                        className="skeleton"
                        style={{ height: 30, width: 72, borderRadius: 6 }}
                      />
                      <div
                        className="skeleton"
                        style={{ height: 30, width: 60, borderRadius: 6 }}
                      />
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <>
                {proSpaces.map((space) => (
                  <tr key={space.id}>
                    <td>
                      <div className={styles.tableCell}>
                        <div className={styles.tableThumb}>
                          {space.thumbnailUrl ? (
                            <img
                              src={`/api/${space.thumbnailUrl}`}
                              alt={space.name}
                              className={styles.thumbImg}
                            />
                          ) : (
                            <div className={styles.thumbEmpty} />
                          )}
                        </div>
                        <span>{space.name}</span>
                      </div>
                    </td>
                    <td>
                      <div className={styles.availabilityCell}>
                        <Switch
                          checked={space.isAvailable}
                          disabled={
                            availabilityMut.isPending &&
                            availabilityMut.variables?.id === space.id
                          }
                          onChange={(e) => {
                            const next = e.target.checked;
                            if (next) {
                              availabilityMut.mutate({
                                id: space.id,
                                isAvailable: true,
                                revokeAccesses: false,
                              });
                            } else {
                              setAvailabilityTarget({
                                id: space.id,
                                name: space.name,
                              });
                            }
                          }}
                        />
                        <span
                          className={
                            space.isAvailable
                              ? "badge badge-success"
                              : "badge badge-danger"
                          }
                        >
                          {space.isAvailable ? "Disponible" : "Occupé"}
                        </span>
                      </div>
                    </td>
                    <td
                      className="text-muted"
                      style={{ fontSize: "0.8125rem" }}
                    >
                      {space.photoCount}p · {space.videoCount}v
                    </td>
                    <td>{space.userCount}</td>
                    <td className={styles.actionsCol}>
                      <div
                        style={{
                          display: "flex",
                          gap: 6,
                          justifyContent: "flex-end",
                        }}
                      >
                        <Link
                          to={`/espaces-pro/${space.id}`}
                          className="btn btn-ghost btn-sm"
                        >
                          Voir
                        </Link>
                        <button
                          className="btn btn-outline btn-sm"
                          onClick={() =>
                            setEditTargetId(
                              editTargetId === space.id ? null : space.id,
                            )
                          }
                        >
                          {editTargetId === space.id ? "Fermer" : "Modifier"}
                        </button>
                        <button
                          className="btn btn-danger btn-sm"
                          onClick={() =>
                            setDeleteTarget({ id: space.id, name: space.name })
                          }
                        >
                          Suppr.
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {proSpaces.length === 0 && (
                  <tr>
                    <td colSpan={5} className={styles.emptyCell}>
                      Aucun espace pro.
                    </td>
                  </tr>
                )}
              </>
            )}
          </tbody>
        </table>
      </div>

      {editTargetId !== null && (
        <ResourceEditForm
          key={editTargetId}
          resourceId={editTargetId === "new" ? null : editTargetId}
          onClose={() => setEditTargetId(null)}
          config={proSpaceEditConfig}
        />
      )}

      <ConfirmModal
        isOpen={!!deleteTarget}
        title="Supprimer l'espace pro"
        message={`Êtes-vous sûr de vouloir supprimer "${deleteTarget?.name}" ? Cette action est irréversible.`}
        confirmLabel="Supprimer"
        cancelLabel="Annuler"
        variant="danger"
        onConfirm={() => {
          if (deleteTarget) deleteMut.mutate(deleteTarget.id);
          setDeleteTarget(null);
        }}
        onCancel={() => setDeleteTarget(null)}
      />

      <ConfirmModal
        isOpen={!!availabilityTarget}
        title="Rendre l'espace pro occupé"
        message={`Voulez-vous également révoquer tous les accès existants pour "${availabilityTarget?.name}" ?`}
        confirmLabel="Révoquer les accès"
        denyLabel="Ne pas révoquer"
        cancelLabel="Annuler"
        variant="danger"
        onConfirm={() => {
          if (availabilityTarget) {
            availabilityMut.mutate({
              id: availabilityTarget.id,
              isAvailable: false,
              revokeAccesses: true,
            });
          }
          setAvailabilityTarget(null);
        }}
        onDeny={() => {
          if (availabilityTarget) {
            availabilityMut.mutate({
              id: availabilityTarget.id,
              isAvailable: false,
              revokeAccesses: false,
            });
          }
          setAvailabilityTarget(null);
        }}
        onCancel={() => setAvailabilityTarget(null)}
      />
    </>
  );
}
