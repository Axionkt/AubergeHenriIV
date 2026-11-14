import { useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "../../lib/axios";
import { keys } from "../../lib/query";
import { getApiErrorMessage } from "../../lib/apiError";
import ConfirmModal from "../ConfirmModal";
import styles from "./Admin.module.css";
import {
  ApartmentItemAdmin,
  ApartmentDetailsAdmin,
} from "../../types/apartment";
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

interface AptForm extends BaseResourceForm {
  inductionCooktopModel: string;
  ovenModel: string;
  rangeHoodModel: string;
  kitchenCabinetsModel: string;
}

const EMPTY_APT: AptForm = {
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
  inductionCooktopModel: "",
  ovenModel: "",
  rangeHoodModel: "",
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

function aptToForm(apt: ApartmentDetailsAdmin): AptForm {
  const form = { ...EMPTY_APT } as Record<string, string | boolean>;

  for (const key of Object.keys(EMPTY_APT) as (keyof AptForm)[]) {
    const value = apt[key];
    form[key] =
      typeof EMPTY_APT[key] === "boolean"
        ? Boolean(value)
        : String(value ?? "");
  }

  return form as unknown as AptForm;
}

function formToPayload(form: AptForm): Record<string, unknown> {
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
    inductionCooktopModel: form.inductionCooktopModel,
    ovenModel: form.ovenModel,
    rangeHoodModel: form.rangeHoodModel,
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

const kitchenFields: KitchenFieldConfig<AptForm>[] = [
  { key: "inductionCooktopModel", label: "Plaque à induction" },
  { key: "ovenModel", label: "Four" },
  { key: "rangeHoodModel", label: "Hotte" },
  { key: "kitchenCabinetsModel", label: "Meubles de cuisine" },
];

const apartmentEditConfig: ResourceEditConfig<ApartmentDetailsAdmin, AptForm> =
  {
    copy: {
      loadingTitle: "Chargement…",
      loadingBody: "Récupération des détails de l'appartement…",
      errorTitle: "Erreur",
      errorBody: "Impossible de charger les détails de cet appartement.",
      newTitle: "Nouvel appartement",
      editTitlePrefix: "Modifier — ",
      nameLabel: "Nom de l'appartement",
      namePlaceholder: "Appartement 4B",
      descriptionPlaceholder: "Décrivez l'appartement…",
      noMediaText: "Aucun média pour cet appartement",
      requiredNameError: "Le nom est requis.",
      createSuccess: "Appartement créé.",
      updateSuccess: "Modifications enregistrées.",
      genericError: "Une erreur est survenue.",
      closeButton: "Fermer",
      createSuccessThumbnailFailed:
        "Appartement créé. La miniature n'a cependant pas pu être envoyée — vous pouvez réessayer en modifiant la fiche.",
    },
    api: {
      detailUrl: (id) => `/admin/apartments/${id}`,
      createUrl: "/admin/apartments",
      mediaListUrl: (id) => `/admin/apartments/${id}/media`,
      mediaThumbnailUrl: (id) => `/admin/media/apartment/${id}/thumbnail`,
      mediaPlanUrl: (id) => `/admin/media/apartment/${id}/plan`,
      mediaBulkUrl: (id) => `/admin/media/apartment/${id}`,
      mediaReorderUrl: (id) => `/admin/media/apartment/${id}/reorder`,
    },
    queryKeys: {
      detail: (id) => keys.apartmentAdmin(id),
      media: (id) => keys.apartmentMediaAdmin(id),
      invalidateOnSave: keys.apartments(),
    },
    emptyForm: EMPTY_APT,
    toForm: aptToForm,
    toPayload: formToPayload,
    kitchenFields,
  };

export default function ApartmentsPanel() {
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
    data: apartments = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey: keys.apartmentsAdmin(),
    queryFn: () =>
      api.get<ApartmentItemAdmin[]>("/admin/apartments").then((r) => r.data),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => api.delete(`/admin/apartments/${id}`),
    onMutate: (id) => {
      return { deletedId: id };
    },
    onSuccess: (_, __, context) => {
      qc.invalidateQueries({ queryKey: keys.apartments() });
      if (context.deletedId === editTargetId) setEditTargetId(null);
      setDeleteError(null);
    },
    onError: (err) =>
      setDeleteError(
        getApiErrorMessage(err, "Impossible de supprimer l'appartement."),
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
      api.put(`/admin/apartments/${id}/availability`, {
        isAvailable,
        revokeAccesses,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.apartments() });
      qc.invalidateQueries({ queryKey: keys.userApartmentAccesses() });
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
          <h2>Appartements</h2>
        </div>
        <button
          className="btn btn-primary btn-sm"
          onClick={() => setEditTargetId("new")}
        >
          + Nouvel appartement
        </button>
      </div>

      {isError && (
        <p className="msg-error" style={{ marginBottom: 16 }}>
          Impossible de charger les appartements.
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
              <th>Appartement</th>
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
                {apartments.map((apt) => (
                  <tr key={apt.id}>
                    <td>
                      <div className={styles.tableCell}>
                        <div className={styles.tableThumb}>
                          {apt.thumbnailUrl ? (
                            <img
                              src={`/api/${apt.thumbnailUrl}`}
                              alt={apt.name}
                              className={styles.thumbImg}
                            />
                          ) : (
                            <div className={styles.thumbEmpty} />
                          )}
                        </div>
                        <span>{apt.name}</span>
                      </div>
                    </td>
                    <td>
                      <div className={styles.availabilityCell}>
                        <Switch
                          checked={apt.isAvailable}
                          disabled={
                            availabilityMut.isPending &&
                            availabilityMut.variables?.id === apt.id
                          }
                          onChange={(e) => {
                            const next = e.target.checked;
                            if (next) {
                              availabilityMut.mutate({
                                id: apt.id,
                                isAvailable: true,
                                revokeAccesses: false,
                              });
                            } else {
                              setAvailabilityTarget({
                                id: apt.id,
                                name: apt.name,
                              });
                            }
                          }}
                        />
                        <span
                          className={
                            apt.isAvailable
                              ? "badge badge-success"
                              : "badge badge-danger"
                          }
                        >
                          {apt.isAvailable ? "Disponible" : "Occupé"}
                        </span>
                      </div>
                    </td>
                    <td
                      className="text-muted"
                      style={{ fontSize: "0.8125rem" }}
                    >
                      {apt.photoCount}p · {apt.videoCount}v
                    </td>
                    <td>{apt.userCount}</td>
                    <td className={styles.actionsCol}>
                      <div
                        style={{
                          display: "flex",
                          gap: 6,
                          justifyContent: "flex-end",
                        }}
                      >
                        <Link
                          to={`/appartements/${apt.id}`}
                          className="btn btn-ghost btn-sm"
                        >
                          Voir
                        </Link>
                        <button
                          className="btn btn-outline btn-sm"
                          onClick={() =>
                            setEditTargetId(
                              editTargetId === apt.id ? null : apt.id,
                            )
                          }
                        >
                          {editTargetId === apt.id ? "Fermer" : "Modifier"}
                        </button>
                        <button
                          className="btn btn-danger btn-sm"
                          onClick={() =>
                            setDeleteTarget({ id: apt.id, name: apt.name })
                          }
                        >
                          Suppr.
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {apartments.length === 0 && (
                  <tr>
                    <td colSpan={5} className={styles.emptyCell}>
                      Aucun appartement.
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
          config={apartmentEditConfig}
        />
      )}

      <ConfirmModal
        isOpen={!!deleteTarget}
        title="Supprimer l'appartement"
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
        title="Rendre l'appartement occupé"
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
