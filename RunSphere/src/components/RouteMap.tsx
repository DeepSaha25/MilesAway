import React, {useEffect, useMemo, useRef} from 'react';
import {StyleSheet, View, ViewStyle} from 'react-native';
import MapView, {Marker, Polyline, Region} from 'react-native-maps';
import {Colors} from '../theme/colors';
import {RunCoordinate} from '../utils/runMetrics';

interface RouteMapProps {
  coordinates: RunCoordinate[];
  height?: number;
  style?: ViewStyle;
}

const anonymizeCoordinate = (coordinate: RunCoordinate): RunCoordinate => ({
  ...coordinate,
  latitude: Number(coordinate.latitude.toFixed(3)),
  longitude: Number(coordinate.longitude.toFixed(3)),
});

const RouteMap = ({coordinates, height = 280, style}: RouteMapProps) => {
  const mapRef = useRef<MapView>(null);

  const route = useMemo(
    () => coordinates.map(anonymizeCoordinate),
    [coordinates],
  );
  const routeCoordinates = useMemo(
    () => route.map(point => ({latitude: point.latitude, longitude: point.longitude})),
    [route],
  );
  const start = route[0] || null;
  const end = route[route.length - 1] || null;
  const initialRegion: Region = {
    latitude: route[0]?.latitude ?? 20.5937,
    longitude: route[0]?.longitude ?? 78.9629,
    latitudeDelta: route.length ? 0.015 : 18,
    longitudeDelta: route.length ? 0.015 : 18,
  };

  useEffect(() => {
    if (route.length === 0) {
      return;
    }

    if (route.length === 1) {
      mapRef.current?.animateCamera(
        {
          center: {latitude: route[0].latitude, longitude: route[0].longitude},
          zoom: 14,
        },
        {duration: 500},
      );
      return;
    }

    mapRef.current?.fitToCoordinates(routeCoordinates, {
      edgePadding: {top: 52, right: 52, bottom: 52, left: 52},
      animated: true,
    });
  }, [route, routeCoordinates]);

  return (
    <MapView
      ref={mapRef}
      style={[styles.map, {height}, style]}
      initialRegion={initialRegion}
      showsCompass={false}
      showsMyLocationButton={false}
      showsUserLocation={false}
      toolbarEnabled={false}
      loadingEnabled>
      {routeCoordinates.length >= 2 ? (
        <Polyline
          coordinates={routeCoordinates}
          strokeColor={Colors.primary}
          strokeWidth={5}
        />
      ) : null}

      {start ? (
        <Marker coordinate={start} anchor={{x: 0.5, y: 0.5}}>
          <View style={styles.startMarker} />
        </Marker>
      ) : null}

      {end ? (
        <Marker coordinate={end} anchor={{x: 0.5, y: 0.5}}>
          <View style={styles.endMarker} />
        </Marker>
      ) : null}
    </MapView>
  );
};

const styles = StyleSheet.create({
  map: {
    borderRadius: 22,
    overflow: 'hidden',
  },
  startMarker: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#18A957',
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  endMarker: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#D93025',
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
});

export default RouteMap;
