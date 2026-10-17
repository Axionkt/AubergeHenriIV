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
  return {
    name: apt.name,
    description: apt.description,
    type: apt.type,
    sizeCarrezSqm: apt.sizeCarrezSqm != null ? String(apt.sizeCarrezSqm) : "",
    sizeFloorSqm: apt.sizeFloorSqm != null ? String(apt.sizeFloorSqm) : "",
    floor: apt.floor,
    orientation: apt.orientation,
    view: apt.view ?? "",
    hasPrivateExterior: apt.hasPrivateExterior,
    electricHeatingModel: apt.electricHeatingModel ?? "",
    bathroomTowelHeaterModel: apt.bathroomTowelHeaterModel ?? "",
    electricWaterHeaterModel: apt.electricWaterHeaterModel ?? "",
    inductionCooktopModel: apt.inductionCooktopModel ?? "",
    ovenModel: apt.ovenModel ?? "",
    rangeHoodModel: apt.rangeHoodModel ?? "",
    kitchenCabinetsModel: apt.kitchenCabinetsModel ?? "",
    dpeEnergyRating: apt.dpeEnergyRating ?? "",
    dpeEnergyKwhPerSqmYear:
      apt.dpeEnergyKwhPerSqmYear != null
        ? String(apt.dpeEnergyKwhPerSqmYear)
        : "",
    dpeEmissionsRating: apt.dpeEmissionsRating ?? "",
    dpeEmissionsKgPerSqmYear:
      apt.dpeEmissionsKgPerSqmYear != null
        ? String(apt.dpeEmissionsKgPerSqmYear)
        : "",
    previousTenantAnnualConsumptionEur:
      apt.previousTenantAnnualConsumptionEur != null
        ? String(apt.previousTenantAnnualConsumptionEur)
        : "",
    hasDoubleGlazedWindows: apt.hasDoubleGlazedWindows,
    meterPowerKva: apt.meterPowerKva != null ? String(apt.meterPowerKva) : "",
    deliveryPointId: apt.deliveryPointId ?? "",
    hasFiberOptic: apt.hasFiberOptic,
    hasCopperNetwork: apt.hasCopperNetwork,
    hasTvOutlet: apt.hasTvOutlet,
    landRegistryRefPre2025: apt.landRegistryRefPre2025 ?? "",
    landRegistryRefPost2025: apt.landRegistryRefPost2025 ?? "",
  };
}

function formToPayload(form: AptForm): Record<string, unknown> {
  return {
    name: form.name,
    description: form.description,
    type: form.type,
    sizeCarrezSqm: Number(form.sizeCarrezSqm),
    sizeFloorSqm: Number(form.sizeFloorSqm),
    floor: form.floor,
    orientation: form.orientation,
    view: form.view,
    hasPrivateExterior: form.hasPrivateExterior,
    electricHeatingModel: form.electricHeatingModel,
    bathroomTowelHeaterModel: form.bathroomTowelHeaterModel,
    electricWaterHeaterModel: form.electricWaterHeaterModel,
    inductionCooktopModel: form.inductionCooktopModel,
    ovenModel: form.ovenModel,
    rangeHoodModel: form.rangeHoodModel,
    kitchenCabinetsModel: form.kitchenCabinetsModel,
    dpeEnergyRating: form.dpeEnergyRating,
    dpeEnergyKwhPerSqmYear: Number(form.dpeEnergyKwhPerSqmYear),
    dpeEmissionsRating: form.dpeEmissionsRating,
    dpeEmissionsKgPerSqmYear: Number(form.dpeEmissionsKgPerSqmYear),
    previousTenantAnnualConsumptionEur: Number(
      form.previousTenantAnnualConsumptionEur,
    ),
    hasDoubleGlazedWindows: form.hasDoubleGlazedWindows,
    meterPowerKva: Number(form.meterPowerKva),
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
      createUrl: "/admin/apartments/create",
      mediaListUrl: (id) => `/admin/apartments/${id}/media`,
      mediaThumbnailUrl: (id) => `/admin/media/apartment/${id}/thumbnail`,
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
                          {apt.isAvailable ? "Disponible" : "Indisponible"}
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
        title="Rendre l'appartement indisponible"
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
