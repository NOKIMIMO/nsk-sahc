import 'package:flutter/material.dart';



void main() {
  runApp(const MaterialApp(
    title: 'El parking',
    home: MainScreen(),
  ));
}

class MainScreen extends StatefulWidget {
  const MainScreen({super.key});

  @override
  State<MainScreen> createState() => _MainScreenState();
}

class ParkingPlace {
  bool isOccupied;
  String label;
  bool isElectric;

  ParkingPlace({
    required this.isOccupied,
    required this.label,
    required this.isElectric,
  });
    
}

class _MainScreenState extends State<MainScreen> {
  final List<String> rows = ['A', 'B', 'C', 'D', 'E', 'F'];
  Map<String, bool> occupiedStates = {};
  Map<String, bool> tappedStates = {};

  @override
  void initState() {
    super.initState();
    // Initialize states for all parking spots
    for (var row in rows) {
      for (int i = 1; i <= 10; i++) {
        String spotId = '$row${i.toString().padLeft(2, '0')}';
        occupiedStates[spotId] = false;
        tappedStates[spotId] = false;
      }
    }
    // Make some spots occupied for demo
    occupiedStates['A02'] = true;
    occupiedStates['A04'] = true;
    occupiedStates['B03'] = true;
    occupiedStates['F01'] = true;
    occupiedStates['F03'] = true;
  }

  Widget buildParkingSpot(String spotId) {
    bool isOccupied = occupiedStates[spotId] ?? false;
    bool isTapped = tappedStates[spotId] ?? false;
    bool isElectric = spotId.startsWith('A') || spotId.startsWith('F');

    return Container(
      width: 80,
      height: 80,
      margin: const EdgeInsets.all(4),
      child: Card(
        elevation: 4,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(8),
          side: BorderSide(
            color: isElectric
                ? Colors.blue.shade700 
                : Colors.transparent,
            width: 3,
          ),
        ),
        child: InkWell(
          onTap: () {
            setState(() {
              if (!isOccupied) {
                tappedStates[spotId] = !isTapped;
              }
            });
          },
          child: Container(
            decoration: BoxDecoration(
              gradient: LinearGradient(
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
                colors: isOccupied
                    ? [Colors.red.shade700, Colors.red.shade400]
                    : isTapped
                        ? [Colors.green.shade700, Colors.green.shade400]
                        : [Colors.grey.shade700, Colors.grey.shade400],
              ),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Stack(
              children: [
                // Main content
                Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(
                        isOccupied ? Icons.close : Icons.local_parking,
                        size: 24,
                        color: Colors.white,
                      ),
                      const SizedBox(height: 4),
                      Text(
                        spotId,
                        style: const TextStyle(
                          fontSize: 12,
                          fontWeight: FontWeight.bold,
                          color: Colors.white,
                        ),
                      ),
                    ],
                  ),
                ),
                // Electric plug icon in top-right corner
                if (isElectric)
                  Positioned(
                    top: 4,
                    right: 4,
                    child: Icon(
                      Icons.electric_bolt,
                      size: 16,
                      color: Colors.yellow.shade300,
                    ),
                  ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget buildParkingRow(String rowLabel) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8.0),
      child: Row(
        children: [
          // Row label
          Container(
            width: 40,
            alignment: Alignment.center,
            child: Text(
              rowLabel,
              style: const TextStyle(
                fontSize: 24,
                fontWeight: FontWeight.bold,
                color: Colors.blue,
              ),
            ),
          ),
          // Horizontal scrollable parking spots
          Expanded(
            child: SingleChildScrollView(
              scrollDirection: Axis.horizontal,
              child: Row(
                children: List.generate(10, (index) {
                  String spotId = '$rowLabel${(index + 1).toString().padLeft(2, '0')}';
                  return buildParkingSpot(spotId);
                }),
              ),
            ),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    // Check if at least one spot is selected
    bool hasSelection = tappedStates.values.any((value) => value);
    
    return Scaffold(
      appBar: AppBar(
        title: const Text('Parking Lot Map'),
        backgroundColor: Colors.blue,
      ),
      body: Column(
        children: [
          // Scrollable rows
          Expanded(
            child: ListView(
              padding: const EdgeInsets.all(8),
              children: rows.map((row) => buildParkingRow(row)).toList(),
            ),
          ),
          Container(
            padding: const EdgeInsets.all(8),
            color: Colors.blue.shade50,
            child: OverflowBar(
              alignment: MainAxisAlignment.center,
              children: [
                ElevatedButton(
                  onPressed: hasSelection ? () {
                    // Validate selected spots
                    List<String> selectedSpots = tappedStates.entries
                        .where((e) => e.value)
                        .map((e) => e.key)
                        .toList();
                    print('Selected spots: $selectedSpots');
                    // Clear selection after validation
                    setState(() {
                      for (var spot in selectedSpots) {
                        tappedStates[spot] = false;
                      }
                    });
                  } : null,
                  child: const Text('Valider'),
                ),
                ElevatedButton(
                  onPressed: hasSelection ? () {
                    // Clear selection
                    setState(() {
                      tappedStates.updateAll((key, value) => false);
                    });
                  } : null,
                  child: const Text('Annuler'),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}