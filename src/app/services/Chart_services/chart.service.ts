import { Injectable } from '@angular/core';
import { Chart } from 'chart.js';

@Injectable({
  providedIn: 'root',
})
export class ChartService {
  constructor() {}

  createChart(chartData: any) {
    if (chartData) {
      // Assuming you have access to the canvas and ctx as before
      const canvas = document.getElementById(
        'myChart'
      ) as HTMLCanvasElement | null;
      const ctx = canvas?.getContext('2d');

      if (!canvas || !ctx) {
        console.error('Chart canvas element or context not found.');
        return;
      }

      // Create the chart using the provided chart data
      new Chart(ctx, {
        type: 'line',
        data: chartData,
        options: {
          responsive: true,
          scales: {
            y: {
              ticks: {
                color: 'white',
                font: { family: 'Open Sans,sans-serif', weight: 'bold' },
              },
            },
            x: {
              ticks: {
                color: 'white',
                font: { family: 'Open Sans,sans-serif', weight: 'bold' },
              },
            },
          },
          elements: {
            line: {
              borderColor: this.getRandomColor(),
            },
            point: {
              radius: 2, // Set point radius to 10
            },
          },
        },
      });
    } else {
      console.error('Chart data not found.');
    }
  }
  getRandomColor(): string {
    const letters = '0123456789ABCDEF';
    let color = '#';
    for (let i = 0; i < 6; i++) {
      color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
  }

  destroyChart(canvasId: string) {
    const canvas = document.getElementById(canvasId) as HTMLCanvasElement;
    const existingChart = Chart.getChart(canvas);
    if (existingChart) {
      existingChart.destroy();
    }
  }

  processChart(allDatasets: any, labels: any, ctx: any) {
    console.log(labels);

    if (allDatasets.length > 0) {
      const chartData = {
        labels: labels,
        datasets: allDatasets,
      };
      const chartDataString = JSON.stringify(chartData);

      sessionStorage.setItem('chartData', chartDataString);

      const allYAverages = allDatasets.map(
        (dataset: { data: any[] }) =>
          dataset.data.reduce(
            (sum: any, point: { y: any }) => sum + point.y,
            0
          ) / dataset.data.length
      );

      const minYValue = Math.min(...allYAverages);
      const maxYValue = Math.max(...allYAverages);

      const yAxesConfig = {
        y: {
          type: 'linear',
          ticks: {
            min: minYValue,
            max: maxYValue,
            beginAtZero: true,
            color: 'white',
            font: { family: 'Open Sans,sans-serif', weight: 'bold' },
          },
        },
        x: {
          ticks: {
            color: 'white',
            font: { family: 'Open Sans,sans-serif', weight: 'bold' },
          },
        },
      };
      const color = this.getRandomColor();
      new Chart(ctx, {
        type: 'line',
        data: chartData,
        options: {
          plugins: {
            legend: {
              labels: {
                pointStyle: 'circle',
                usePointStyle: true,
              },
            },
          },
          animation: {
            duration: 1000, // Set the animation duration in milliseconds
            easing: 'easeInOutQuart', // Choose an easing function (e.g., 'linear', 'easeOutCubic', etc.)
          },
          scales: yAxesConfig as any,
          elements: {
            line: {
              tension: 0.8,
            },
            point: {
              radius: 0,
            },
          },
        },
      });
    }
  }

  createPieChart(
    canvas: HTMLCanvasElement,
    labels: string[],
    dataPoints: number[]
  ): void {
    const backgroundColors = labels.map(() => this.getRandomColor());
    new Chart(canvas, {
      type: 'pie',
      data: {
        labels: labels,
        datasets: [
          {
            data: dataPoints,
            backgroundColor: backgroundColors,
          },
        ],
      },
      options: {
        animation: {
          animateScale: true, // Enable scaling animation
          animateRotate: true, // Enable rotation animation
          duration: 1000, // Animation duration in milliseconds
          easing: 'easeInOutQuart', // Easing function for the animation
        },
        hover: {
          mode: 'nearest', // Interaction mode when hovering over the chart
        },
        plugins: {
          legend: {
            display: true, // Display the legend
            position: 'top', // Legend position (top, bottom, left, right)
          },
        },
      },
    });
  }
}
