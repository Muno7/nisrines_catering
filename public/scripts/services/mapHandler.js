export class LocationPicker {
  constructor(mapId) {
    if (!mapId) {
      throw new Error('mapId is required for AdvancedMarkerElement');
    }
    this.mapId = mapId;
    this.map = null;
    this.marker = null;
    this.infoWindow = null;
    this.searchBox = null;
    this.defaultCenter = { lat: 33.8938, lng: 35.5018 }; // Beirut
    this.lebanonBounds = {
      north: 34.6923,
      south: 33.0479,
      west: 35.1260,
      east: 36.6239
    };
  }

  async initialize() {
    // Import required libraries
    const [{ Map }, { AdvancedMarkerElement }] = await Promise.all([
      google.maps.importLibrary("maps"),
      google.maps.importLibrary("marker"),
    ]);

    // Initialize map
    this.map = new google.maps.Map(document.getElementById("map"), {
      center: this.defaultCenter,
      zoom: 13,
      mapTypeControl: false,
      mapId: this.mapId
    });

    // Initialize marker
    this.marker = new AdvancedMarkerElement({
      map: null // Initially not shown
    });

    // Initialize info window
    this.infoWindow = new google.maps.InfoWindow();

    // Setup all event listeners
    this.setupMapClickListener();
    this.setupSearchBox();
    this.addLocationButton();
  }

  setupMapClickListener() {
    this.map.addListener("click", (event) => {
      this.setMarkerPosition(event.latLng);
    });
  }

  setupSearchBox() {
    const card = document.createElement('div');
    card.className = 'search-box-container';
    
    const input = document.createElement('input');
    input.id = 'search-box';
    input.placeholder = 'Search for a location';
    card.appendChild(input);

    this.map.controls[google.maps.ControlPosition.TOP_LEFT].push(card);

    this.searchBox = new google.maps.places.SearchBox(input, {
      bounds: this.lebanonBounds,
      strictBounds: true
    });

    this.searchBox.addListener('places_changed', () => {
      const places = this.searchBox.getPlaces();
      if (places.length === 0) return;

      const place = places[0];
      if (!place.geometry || !place.geometry.location) return;

      this.setMarkerPosition(place.geometry.location);
      this.map.panTo(place.geometry.location);
      this.map.setZoom(17);
    });
  }

  addLocationButton() {
    const locationButton = document.createElement("button");
    locationButton.textContent = "My Location";
    locationButton.className = "custom-location-button";

    const buttonContainer = document.createElement('div');
    buttonContainer.className = 'button-container';
    buttonContainer.appendChild(locationButton);
    
    this.map.controls[google.maps.ControlPosition.LEFT_BOTTOM].push(buttonContainer); 

    locationButton.addEventListener("click", () => {
      if (navigator.geolocation) {
        // Add loading state to button
        locationButton.disabled = true;
        locationButton.textContent = "Getting location...";

        const options = {
          enableHighAccuracy: true,  // Request high accuracy
          timeout: 10000,            // Time to wait for position
          maximumAge: 0              // Don't use cached position
        };

        navigator.geolocation.getCurrentPosition(
          (position) => {
            const pos = new google.maps.LatLng(
              position.coords.latitude,
              position.coords.longitude
            );

            this.setMarkerPosition(pos);
            this.map.panTo(pos);
            this.map.setZoom(18); // Increased zoom level for better precision

            // Reset button state
            locationButton.disabled = false;
            locationButton.textContent = "My Location";
          },
          (error) => {
            this.handleLocationError(true, error);
            // Reset button state
            locationButton.disabled = false;
            locationButton.textContent = "My Location";
          },
          options
        );
      } else {
        this.handleLocationError(false);
      }
    });
  }

  handleLocationError(browserHasGeolocation, error = null) {
    let content = browserHasGeolocation
      ? "Error: The Geolocation service failed."
      : "Error: Your browser doesn't support geolocation.";

    // Add more specific error information if available
    if (error) {
      switch(error.code) {
        case error.PERMISSION_DENIED:
          content = "Location access was denied. Please enable location services in your browser.";
          break;
        case error.POSITION_UNAVAILABLE:
          content = "Location information is unavailable. Please try again.";
          break;
        case error.TIMEOUT:
          content = "Location request timed out. Please try again.";
          break;
      }
    }
      
    this.infoWindow.setContent(content);
    this.infoWindow.setPosition(this.map.getCenter());
    this.infoWindow.open(this.map);
  }

  setMarkerPosition(position) {
    if (!position) return;
    // Update marker position
    this.marker.position = position;
    this.marker.map = this.map;
  }

  handleLocationError(browserHasGeolocation) {
    const content = browserHasGeolocation
      ? "Error: The Geolocation service failed."
      : "Error: Your browser doesn't support geolocation.";
      
    this.infoWindow.setContent(content);
    this.infoWindow.setPosition(this.map.getCenter());
    this.infoWindow.open(this.map);
  }

  hasLocationSelected() {
    return this.marker !== null && this.marker.map !== null;
  }

  getGoogleMapsLink() {
    if (!this.hasLocationSelected()) return null;
    
    const position = this.marker.position;
    return `https://www.google.com/maps?q=${position.lat},${position.lng}`;
  }
}

// CSS styles for the UI elements
const styles = `
.search-box-container {
  margin: 10px;
  padding: 5px;
  background: white;
  border-radius: 4px;
  width: 75%;
  box-shadow: 0 2px 4px rgba(0,0,0,0.2);
}

#search-box {
  width: 100%;
  padding: 8px;
  border: none;
  border-radius: 2px;
  font-size: 14px;
}

.custom-location-button {
  margin-left: 10px;
  padding: 8px 16px;
  background: #4285f4;
  color: white;
  border: none;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.2);
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 5px;
  transition: background-color 0.2s;
}

.custom-location-button:hover {
  background: #3367d6;
}

.custom-location-button:active {
  background: #2850a7;
  transform: translateY(1px);
}
`;

// Add styles to document
const styleSheet = document.createElement("style");
styleSheet.textContent = styles;
document.head.appendChild(styleSheet);
