import React, { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { OrderShipmentDto } from "@/types/order";
import { interpolateGeoPoint, resolveVietnamCoords, type GeoPoint } from "../utils/geoLookup";

interface OrderTrackingMapProps {
  warehouseName?: string | null;
  warehouseAddress?: string | null;
  destinationAddress: string;
  orderStatus: string;
  shipment?: OrderShipmentDto | null;
}

function createPinIcon(color: string, emoji: string): L.DivIcon {
  return L.divIcon({
    className: "",
    html: `<div style="
      width: 30px;
      height: 30px;
      border-radius: 999px;
      background: ${color};
      color: #fff;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 14px;
      border: 2px solid #fff;
      box-shadow: 0 2px 8px rgba(0,0,0,0.28);
    ">${emoji}</div>`,
    iconSize: [30, 30],
    iconAnchor: [15, 15],
  });
}

function getProgressRatio(orderStatus: string, shippingStatus?: string): number {
  if (shippingStatus === "Delivered" || orderStatus === "Delivered" || orderStatus === "Completed") {
    return 1;
  }
  if (shippingStatus === "InTransit") return 0.68;
  if (shippingStatus === "PickedUp" || orderStatus === "Shipped") return 0.35;
  if (orderStatus === "Processing" || shippingStatus === "Preparing") return 0.08;
  return 0;
}

export const OrderTrackingMap: React.FC<OrderTrackingMapProps> = ({
  warehouseName,
  warehouseAddress,
  destinationAddress,
  orderStatus,
  shipment,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    if (mapRef.current) {
      mapRef.current.remove();
      mapRef.current = null;
    }

    const origin = resolveVietnamCoords(warehouseAddress || warehouseName, {
      lat: 21.0285,
      lng: 105.8542,
      label: warehouseName || "Kho xuất hàng",
    });

    const destination = resolveVietnamCoords(destinationAddress, {
      lat: 10.7769,
      lng: 106.7009,
      label: destinationAddress,
    });

    const eventPoints: GeoPoint[] = (shipment?.trackingEvents ?? [])
      .slice()
      .reverse()
      .map((ev) => {
        if (ev.latitude != null && ev.longitude != null) {
          return {
            lat: Number(ev.latitude),
            lng: Number(ev.longitude),
            label: `${ev.title}${ev.locationName ? ` (${ev.locationName})` : ""}`,
          };
        }
        return null;
      })
      .filter((p): p is GeoPoint => p !== null);

    const isSameCity =
      Math.abs(origin.lat - destination.lat) < 0.05 &&
      Math.abs(origin.lng - destination.lng) < 0.05;

    const effectiveOrigin: GeoPoint = isSameCity
      ? { lat: origin.lat + 0.025, lng: origin.lng - 0.025, label: origin.label }
      : origin;

    const progress = getProgressRatio(orderStatus, shipment?.shippingStatus);
    const currentPoint =
      eventPoints.length > 0
        ? eventPoints[eventPoints.length - 1]
        : interpolateGeoPoint(
            effectiveOrigin,
            destination,
            progress,
            shipment?.shippingStatus === "Delivered"
              ? "Đã giao tới người nhận"
              : shipment?.shippingStatus === "InTransit"
                ? "Đang trên đường giao tới bạn"
                : "Đang xử lý tại kho"
          );

    const map = L.map(el, {
      zoomControl: true,
      scrollWheelZoom: false,
    });
    mapRef.current = map;

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "&copy; OpenStreetMap",
    }).addTo(map);

    const routeWaypoints: L.LatLngExpression[] = [
      [effectiveOrigin.lat, effectiveOrigin.lng],
      ...eventPoints.map((p): L.LatLngExpression => [p.lat, p.lng]),
      [destination.lat, destination.lng],
    ];

    // Toàn tuyến nét đứt (dự kiến)
    L.polyline(routeWaypoints, {
      color: "#94a3b8",
      weight: 3,
      dashArray: "6, 8",
      opacity: 0.85,
    }).addTo(map);

    // Chặng đã đi nét liền xanh
    if (progress > 0) {
      const traveledPoints: L.LatLngExpression[] = [
        [effectiveOrigin.lat, effectiveOrigin.lng],
        ...eventPoints.map((p): L.LatLngExpression => [p.lat, p.lng]),
        [currentPoint.lat, currentPoint.lng],
      ];
      L.polyline(traveledPoints, {
        color: "#0f766e",
        weight: 4,
        opacity: 0.95,
      }).addTo(map);
    }

    L.marker([effectiveOrigin.lat, effectiveOrigin.lng], {
      icon: createPinIcon("#0f766e", "🏭"),
    })
      .bindPopup(`<strong>Kho xuất:</strong> ${warehouseName || "Kho sàn"}<br/>${warehouseAddress || ""}`)
      .addTo(map);

    eventPoints.forEach((pt) => {
      L.marker([pt.lat, pt.lng], {
        icon: createPinIcon("#0284c7", "📦"),
      })
        .bindPopup(pt.label)
        .addTo(map);
    });

    if (progress > 0 && progress < 1) {
      L.marker([currentPoint.lat, currentPoint.lng], {
        icon: createPinIcon("#f97316", "🚚"),
      })
        .bindPopup(`<strong>Vị trí hiện tại:</strong> ${currentPoint.label}`)
        .addTo(map);
    }

    L.marker([destination.lat, destination.lng], {
      icon: createPinIcon("#dc2626", "📍"),
    })
      .bindPopup(`<strong>Địa chỉ nhận:</strong> ${destinationAddress}`)
      .addTo(map);

    const bounds = L.latLngBounds(routeWaypoints);
    map.fitBounds(bounds, { padding: [36, 36], maxZoom: 13 });

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [warehouseName, warehouseAddress, destinationAddress, orderStatus, shipment]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
      <div
        ref={containerRef}
        style={{
          width: "100%",
          height: "280px",
          borderRadius: "10px",
          overflow: "hidden",
          border: "1px solid var(--color-border)",
          zIndex: 1,
        }}
      />
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "12px",
          fontSize: "12px",
          color: "var(--color-muted)",
        }}
      >
        <span>🏭 Kho xuất</span>
        <span>🚚 Vị trí kiện hàng</span>
        <span>📍 Điểm giao hàng</span>
      </div>
    </div>
  );
};
